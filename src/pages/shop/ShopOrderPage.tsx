import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { errorMessage, shopApi } from '@/api'
import {
  DeliveryChoice,
  OrderBadges,
  OrderItemsTable,
  OrderPaymentsTable,
  PickupPlace,
  TrackingTimeline,
} from '@/components/orders'
import { OnlinePayNote, PayMethodChoice, type PayBy } from '@/components/payments/PayMethodChoice'
import { SlipFields } from '@/components/payments/SlipFields'
import { Button, Card, LoadState, Modal, ModalActions, PageHeader, SectionTitle } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import { PATHS } from '@/routes/paths'
import type { DeliveryMethod, Order, OrderPayment, SlipUpload } from '@/types'
import { goToCheckout } from '@/utils/checkout'
import { lastConfirmedPayment, orderPayStatus } from './payStatus'
import { formatBaht, formatDate, formatDateTime, formatDeadline } from '@/utils/format'

export default function ShopOrderPage() {
  const { id = '' } = useParams()
  const { run, showError, showSuccess } = useToast()
  const { data: order, setData, status, error, reload } = useApiData(() => shopApi.order(id), [id])
  const options = usePaymentOptions()
  const online = options?.onlinePayment ?? false
  const [paying, setPaying] = useState(false)
  // Online is the default when it's available, until the shop picks.
  const [picked, setPicked] = useState<PayBy | null>(null)
  const payBy = picked ?? (online ? 'online' : 'slip')
  const [slip, setSlip] = useState<SlipUpload | null>(null)
  const [busy, setBusy] = useState(false)
  const [slipError, setSlipError] = useState<string | null>(null)
  const onSlip = useCallback((s: SlipUpload | null) => setSlip(s), [])
  const [searchParams, setSearchParams] = useSearchParams()
  const returnedFrom = searchParams.get('payment')
  // Checking right away when the shop is back from Xendit's page.
  const [checking, setChecking] = useState(() => Boolean(returnedFrom))

  const pendingPayment = order?.payments.find((p) => p.status === 'pending')
  const onlinePending = pendingPayment?.method === 'Xendit' ? pendingPayment : undefined
  const canPay = order?.status === 'pending_payment' && !pendingPayment
  // Shown even when nothing is due: "Checking your payment", or "✓ Deposit confirmed" until the next payment.
  const payButton = order ? orderPayStatus(order) : null
  const canCancel = order?.type === 'regular' && canPay && order.paidAmount === 0
  const openCheckout = onlinePending && checkoutStillOpen(onlinePending) ? onlinePending.checkoutUrl : null

  /**
   * Ask the backend to check an online payment with Xendit, a few times while Xendit is still busy.
   * Set `checking` before calling it.
   */
  const checkOnline = useCallback(
    async (paymentId: string, { tries = 1, tell = true } = {}) => {
      try {
        for (let i = 0; i < tries; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 3000))
          const updated = await shopApi.checkPayment(paymentId)
          setData(updated)
          const p = updated.payments.find((x) => x.id === paymentId)
          if (p?.status === 'confirmed') return tell && showSuccess('Payment received. Thank you!')
          if (p?.status === 'rejected')
            return (
              tell &&
              showError('The online payment was not completed. Nothing was charged; you can try again.')
            )
        }
        if (tell)
          showSuccess('Xendit has not confirmed the payment yet. Use "Check payment" again in a minute.')
      } catch (err) {
        showError(errorMessage(err))
      } finally {
        setChecking(false)
      }
    },
    [setData, showError, showSuccess],
  )

  // Back from Xendit's page (?payment=<id>): check how it went, then tidy the address.
  useEffect(() => {
    if (!returnedFrom) return
    setSearchParams({}, { replace: true })
    void checkOnline(returnedFrom, { tries: 4 })
  }, [returnedFrom, setSearchParams, checkOnline])

  async function pay() {
    if (!order) return
    if (payBy === 'online') {
      setBusy(true)
      const ok = await run(async () => goToCheckout((await shopApi.payOnline(order.id)).checkoutUrl))
      if (!ok) setBusy(false) // on success the browser is leaving for Xendit's page
      return
    }
    if (!slip) return setSlipError('Attach the slip')
    setBusy(true)
    const ok = await run(
      async () => setData(await shopApi.pay(order.id, slip)),
      'Slip sent. We will confirm it soon.',
    )
    setBusy(false)
    if (ok) setPaying(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={order ? `Order ${order.orderNo}` : 'Order'}
        subtitle={order && <OrderBadges order={order} />}
        back={{ to: PATHS.orders, label: 'My orders' }}
        actions={
          <>
            {canCancel && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Cancel this order? The boxes go back to stock.')) {
                    void run(async () => setData(await shopApi.cancelOrder(order!.id)), 'Order cancelled')
                  }
                }}
              >
                Cancel order
              </Button>
            )}
            {onlinePending && (
              <Button
                variant="secondary"
                disabled={checking}
                onClick={() => {
                  setChecking(true)
                  void checkOnline(onlinePending.id)
                }}
              >
                {checking ? 'Checking…' : 'Check payment'}
              </Button>
            )}
            {openCheckout && <Button onClick={() => goToCheckout(openCheckout)}>Continue payment</Button>}
            {payButton &&
              !onlinePending &&
              (payButton.enabled ? (
                <Button onClick={() => setPaying(true)}>{payButton.label}</Button>
              ) : (
                <Button variant="outline" disabled>
                  {payButton.confirmed && <span className="text-success">✓ </span>}
                  {payButton.label}
                </Button>
              ))}
          </>
        }
      />
      <LoadState status={status} error={error} onRetry={reload}>
        {order && (
          <>
            <StatusNote order={order} pending={pendingPayment} />
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-5">
                <Card className="space-y-3 p-4 sm:p-5">
                  <SectionTitle>Items</SectionTitle>
                  <OrderItemsTable order={order} />
                </Card>
                {order.payments.length > 0 && (
                  <Card className="space-y-3 p-4 sm:p-5">
                    <SectionTitle>Payments</SectionTitle>
                    <OrderPaymentsTable payments={order.payments} />
                  </Card>
                )}
              </div>
              <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-1">
                <DeliveryCard
                  order={order}
                  onChanged={setData}
                  trackingOn={options?.thaipost.tracking ?? false}
                />
                <Card className="space-y-3 p-4 sm:p-5">
                  <SectionTitle>Order</SectionTitle>
                  <Facts
                    items={[
                      ['Placed', formatDateTime(order.createdAt)],
                      ['Type', order.type === 'preorder' ? 'Pre-order' : 'Regular order'],
                      ...(order.roundTitle ? [['Pre-order', order.roundTitle] as Fact] : []),
                      ...(order.note ? [['Your note', order.note] as Fact] : []),
                    ]}
                  />
                </Card>
              </div>
            </div>
          </>
        )}
      </LoadState>

      {paying && order && (
        <Modal
          title={`Pay for ${order.orderNo}`}
          onClose={() => setPaying(false)}
          footer={
            <ModalActions
              onCancel={() => setPaying(false)}
              onConfirm={() => void pay()}
              confirmLabel={payBy === 'online' ? 'Pay online' : 'Send slip'}
              busy={busy}
            />
          }
        >
          <div className="space-y-4">
            {online && <PayMethodChoice value={payBy} onChange={setPicked} />}
            {payBy === 'online' ? (
              <OnlinePayNote amount={order.amountDue} />
            ) : (
              <SlipFields amount={order.amountDue} onChange={onSlip} />
            )}
          </div>
          {payBy === 'slip' && slipError && !slip && <p className="mt-3 text-sm text-danger">{slipError}</p>}
        </Modal>
      )}
    </div>
  )
}

type Fact = [string, ReactNode]

/** Label above value, one under the other: fits the narrow side cards. */
function Facts({ items }: { items: Fact[] }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{label}</dt>
          <dd className="mt-0.5 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** "We confirmed your deposit of ฿1,608 on 24 Oct 2026." */
function confirmedText(order: Order, what: 'deposit' | 'payment') {
  const p = lastConfirmedPayment(order)
  if (!p) return `We confirmed your ${what}.`
  return `We confirmed your ${what} of ${formatBaht(p.amount)}${p.reviewedAt ? ` on ${formatDate(p.reviewedAt)}` : ''}.`
}

/** An online payment whose Xendit page can still take the payment. */
const checkoutStillOpen = (p: OrderPayment) =>
  Boolean(p.checkoutUrl && p.checkoutExpiresAt && new Date(p.checkoutExpiresAt) > new Date())

/** What the shop needs to know or do now, above the order. */
function StatusNote({ order, pending }: { order: Order; pending?: OrderPayment }) {
  let text: string | null = null
  let urgent = false
  let confirmed = false
  const onlineNote =
    pending?.method === 'Xendit' &&
    (checkoutStillOpen(pending)
      ? `Your online payment is open until ${formatDateTime(pending.checkoutExpiresAt)}. Use "Continue payment" to finish it on Xendit's page.`
      : 'Waiting for Xendit to confirm your online payment.')
  if (order.status === 'pending_payment') {
    urgent = !pending
    text =
      onlineNote ||
      (pending
        ? 'We received your slip and are checking it.'
        : `Please pay ${formatBaht(order.amountDue)} by ${formatDeadline(order.paymentDueAt)}. Unpaid orders are cancelled after the deadline${order.type === 'preorder' ? ' and the deposit is kept' : ''}.`)
  } else if (order.status === 'awaiting_deposit') {
    text = onlineNote || 'We are checking your deposit slip.'
  } else if (order.status === 'awaiting_stock') {
    text = `✓ ${confirmedText(order, 'deposit')} We will ask for the balance when the stock arrives.`
    confirmed = true
  } else if (order.status === 'paid' && order.deliveryMethod === 'pickup') {
    text = `✓ ${confirmedText(order, 'payment')} Your order is ready to pick up at our warehouse. Please bring your order number.`
    confirmed = true
  } else if (order.status === 'paid') {
    text = `✓ ${confirmedText(order, 'payment')} ${order.shipDate ? `Planned ship date: ${formatDate(order.shipDate)}.` : 'We will ship it soon.'}`
    confirmed = true
  } else if (order.status === 'cancelled' && order.cancelReason) {
    text = `Cancelled: ${order.cancelReason}`
  }
  if (!text) return null
  return (
    <Card
      className={
        urgent
          ? 'border-primary/40 bg-primary/5 text-sm'
          : order.status === 'cancelled'
            ? 'border-danger/30 bg-danger/5 text-sm text-danger'
            : confirmed
              ? 'border-success/30 bg-success/5 text-sm'
              : 'text-sm'
      }
    >
      {text}
    </Card>
  )
}

/** A pre-order's delivery can change until its stock arrives (shipping is charged with the balance). */
const canChangeDelivery = (o: Order) =>
  o.type === 'preorder' && (o.status === 'awaiting_deposit' || o.status === 'awaiting_stock')

/** EMS address and tracking, or where to pick up; a pre-order can switch before its stock arrives. */
function DeliveryCard({
  order,
  onChanged,
  trackingOn,
}: {
  order: Order
  onChanged: (o: Order) => void
  trackingOn: boolean
}) {
  const { run } = useToast()
  const [busy, setBusy] = useState(false)
  const pickup = order.deliveryMethod === 'pickup'
  const shipped = order.status === 'shipped'

  async function change(method: DeliveryMethod) {
    if (method === order.deliveryMethod) return
    setBusy(true)
    await run(
      async () => onChanged(await shopApi.setDelivery(order.id, method)),
      method === 'pickup' ? 'You will pick this order up at our warehouse' : 'This order will be sent by EMS',
    )
    setBusy(false)
  }

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <SectionTitle>Delivery</SectionTitle>
      {canChangeDelivery(order) ? (
        <DeliveryChoice
          value={order.deliveryMethod}
          onChange={(m) => void change(m)}
          disabled={busy}
          name="order-delivery"
          emsNote="To your address. Shipping is added to the balance when the stock arrives."
        />
      ) : pickup ? (
        <Facts
          items={[
            ['Pick up at', <PickupPlace key="place" />],
            shipped
              ? ['Picked up', formatDate(order.shippedAt)]
              : [
                  'When',
                  order.status === 'paid' ? 'Ready now. Bring your order number.' : 'Once the order is paid',
                ],
          ]}
        />
      ) : (
        <Facts
          items={[
            ['Ship to', order.shipAddress || 'No address on file (update your profile)'],
            shipped
              ? ['Shipped', formatDate(order.shippedAt)]
              : ['Planned ship date', order.shipDate ? formatDate(order.shipDate) : 'After payment'],
            [
              'Tracking number',
              order.trackingNo ? <span className="font-mono font-semibold">{order.trackingNo}</span> : '—',
            ],
          ]}
        />
      )}
      {canChangeDelivery(order) && pickup && (
        <p className="text-xs text-muted-foreground">
          Pick up at <PickupPlace />, once the balance is paid.
        </p>
      )}
      {!pickup && shipped && order.trackingNo && trackingOn && (
        <TrackingTimeline load={() => shopApi.tracking(order.id)} />
      )}
    </Card>
  )
}
