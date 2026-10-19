import { useCallback, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { shopApi } from '@/api'
import { OrderBadges, OrderItemsTable, OrderPaymentsTable } from '@/components/orders'
import { SlipFields } from '@/components/payments/SlipFields'
import { Button, Card, LoadState, Modal, ModalActions, PageHeader, SectionTitle } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { Order, SlipUpload } from '@/types'
import { formatBaht, formatDate, formatDateTime, formatDeadline } from '@/utils/format'

export default function ShopOrderPage() {
  const { id = '' } = useParams()
  const { run } = useToast()
  const { data: order, setData, status, error, reload } = useApiData(() => shopApi.order(id), [id])
  const [paying, setPaying] = useState(false)
  const [slip, setSlip] = useState<SlipUpload | null>(null)
  const [busy, setBusy] = useState(false)
  const [slipError, setSlipError] = useState<string | null>(null)
  const onSlip = useCallback((s: SlipUpload | null) => setSlip(s), [])

  const slipPending = order?.payments.some((p) => p.status === 'pending') ?? false
  const canPay = order?.status === 'pending_payment' && !slipPending
  const canCancel = order?.type === 'regular' && canPay && order.paidAmount === 0

  async function pay() {
    if (!order) return
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
        back={{ to: PATHS.orders, label: 'Orders' }}
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
            {canPay && <Button onClick={() => setPaying(true)}>Pay {formatBaht(order!.amountDue)}</Button>}
          </>
        }
      />
      <LoadState status={status} error={error} onRetry={reload}>
        {order && (
          <>
            <StatusNote order={order} slipPending={slipPending} />
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
                <Card className="space-y-3 p-4 sm:p-5">
                  <SectionTitle>Delivery</SectionTitle>
                  <Facts
                    items={[
                      ['Ship to', order.shipAddress || 'No address on file (update your profile)'],
                      order.status === 'shipped'
                        ? ['Shipped', formatDate(order.shippedAt)]
                        : [
                            'Planned ship date',
                            order.shipDate ? formatDate(order.shipDate) : 'After payment',
                          ],
                      [
                        'Tracking number',
                        order.trackingNo ? (
                          <span className="font-mono font-semibold">{order.trackingNo}</span>
                        ) : (
                          '—'
                        ),
                      ],
                    ]}
                  />
                </Card>
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
              confirmLabel="Send slip"
              busy={busy}
            />
          }
        >
          <SlipFields amount={order.amountDue} onChange={onSlip} />
          {slipError && !slip && <p className="mt-3 text-sm text-danger">{slipError}</p>}
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

/** What the shop needs to know or do now, above the order. */
function StatusNote({ order, slipPending }: { order: Order; slipPending: boolean }) {
  let text: string | null = null
  let urgent = false
  if (order.status === 'pending_payment') {
    urgent = !slipPending
    text = slipPending
      ? 'We received your slip and are checking it.'
      : `Please pay ${formatBaht(order.amountDue)} by ${formatDeadline(order.paymentDueAt)}. Unpaid orders are cancelled after the deadline${order.type === 'preorder' ? ' and the deposit is kept' : ''}.`
  } else if (order.status === 'awaiting_deposit') {
    text = 'We are checking your deposit slip.'
  } else if (order.status === 'awaiting_stock') {
    text = 'Your deposit is confirmed. We will ask for the balance when the stock arrives.'
  } else if (order.status === 'paid') {
    text = `Paid in full. ${order.shipDate ? `Planned ship date: ${formatDate(order.shipDate)}.` : 'We will ship it soon.'}`
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
            : 'text-sm'
      }
    >
      {text}
    </Card>
  )
}
