import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { shopApi } from '@/api'
import { Button, LoadState } from '@/components/ui'
import { useUser } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { ShopRound } from '@/types'
import { cn } from '@/utils/cn'
import { boxes, formatBaht, formatDate, formatDateTime, formatDeadline } from '@/utils/format'
import { cardButton } from './components/cardButton'
import { Description, DetailLayout, ItemOverline, ProductFacts } from './components/DetailLayout'
import { OfferModal } from './components/OfferModal'
import { ImageBadge, ProductImage } from './components/ProductImage'
import { QtyStepper } from './components/QtyStepper'
import { ShopTabs } from './components/ShopTabs'
import { payStatus } from './payStatus'
import { isTakingRequests, nextDeadline, preorderState } from './preorderState'

/**
 * One pre-order, laid out like a product page. While the round is open the shop picks a quantity
 * and requests boxes (no payment); later the same page shows its offer, to accept with a deposit.
 * Open pre-orders are part of the catalog (tabs above, back to Pre-orders); after requests close
 * they belong to My pre-orders.
 */
export default function PreorderDetailPage() {
  const { id = '' } = useParams()
  const { data, setData, status, error, reload } = useApiData(() => shopApi.round(id), [id])

  return (
    <div className="space-y-5">
      {data && isTakingRequests(data) && <ShopTabs />}
      <LoadState status={status} error={error} onRetry={reload}>
        {data && <PreorderDetail round={data} onChanged={(r) => (r ? setData(r) : void reload())} />}
      </LoadState>
    </div>
  )
}

function PreorderDetail({ round: r, onChanged }: { round: ShopRound; onChanged: (r?: ShopRound) => void }) {
  const user = useUser()
  const state = preorderState(r)
  const deadline = nextDeadline(r)
  const inCatalog = isTakingRequests(r)

  return (
    <DetailLayout
      backTo={inCatalog ? PATHS.preorders : PATHS.myPreorders}
      backLabel={inCatalog ? 'Pre-orders' : 'My pre-orders'}
      image={
        <ProductImage
          src={r.productImageUrl}
          alt={r.productName}
          setCode={r.productSetCode}
          game={r.productGame}
        >
          <ImageBadge tone={state.badgeTone}>{state.badge}</ImageBadge>
        </ProductImage>
      }
    >
      <div className="space-y-2">
        <ItemOverline parts={[r.productGame, r.productCategory, 'Allocation only']} />
        <h1 className="text-2xl leading-tight font-semibold md:text-3xl">{r.title}</h1>
        {r.title !== r.productName && <p className="text-sm text-muted-foreground">{r.productName}</p>}
        <p className="font-mono text-sm text-muted-foreground">{r.productSku}</p>
      </div>

      <div>
        <p className="font-mono text-2xl font-semibold">{formatBaht(r.unitPrice)}</p>
        <p className="text-xs text-muted-foreground">
          Per box, before VAT · {user.tierName ?? 'your'} tier price · {r.depositPct}% deposit when you accept
          your offer
        </p>
      </div>

      {deadline && <p className="text-sm font-medium text-primary-strong">{deadline}</p>}

      <Action round={r} onChanged={onChanged} />

      <p className="text-sm font-semibold">
        Allocation only: a request is not a guaranteed order. When shops ask for more than we receive, the
        boxes are shared out by tier and order history, and you get an offer for your share. You pay the
        deposit only if you accept it.
      </p>

      <Steps round={r} />

      <ProductFacts
        sku={r.productSku}
        category={r.productCategory}
        setCode={r.productSetCode}
        boxesPerCase={r.productBoxesPerCase}
        releaseDate={r.productReleaseDate}
        extra={[
          ['Deposit', `${r.depositPct}% when you accept, the rest when stock arrives`],
          ['Your tier limit', r.maxPreorderQty != null ? boxes(r.maxPreorderQty) : 'No limit'],
        ]}
      />
      <Description text={r.productDescription} />
      {r.note && <Description text={r.note} />}
    </DetailLayout>
  )
}

/** The main action for the round's status: request, accept the offer, or what happens next. */
function Action({ round: r, onChanged }: { round: ShopRound; onChanged: (r?: ShopRound) => void }) {
  const { run } = useToast()
  const [accepting, setAccepting] = useState(false)
  const asked = r.myPreorder?.status === 'submitted' ? r.myPreorder : null
  const offer = r.myAllocation

  if (r.status === 'cancelled') {
    return <Panel tone="danger">This pre-order was cancelled. You have nothing to pay.</Panel>
  }

  if (r.status === 'open') return <RequestForm round={r} onChanged={onChanged} />

  if (r.status === 'allocating') {
    return (
      <Panel>
        Requests are closed
        {asked ? `. You asked for ${boxes(asked.requestedQty)}` : ' and you did not request'}.
        {asked && ' We are sharing out the boxes and will notify you when your offer is ready.'}
      </Panel>
    )
  }

  if (offer?.status === 'offered') {
    const total = offer.offeredQty * offer.unitPrice
    return (
      <div className="space-y-4 rounded-lg border border-primary/50 bg-primary/5 p-4">
        <div>
          <p className="text-lg font-semibold">Your offer: {boxes(offer.offeredQty)}</p>
          <p className="text-sm text-muted-foreground">
            {formatBaht(offer.unitPrice)} per box · {formatBaht(total)} in total
            {asked && ` · you asked for ${asked.requestedQty}`}
          </p>
        </div>
        <p className="text-sm">
          Accept by <b>{formatDeadline(offer.offerExpiresAt)}</b> by paying the {r.depositPct}% deposit. You
          can take fewer boxes than offered; the rest go back to the pool.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(cardButton.primary, 'w-auto flex-1 px-6')}
            onClick={() => setAccepting(true)}
          >
            Accept offer…
          </button>
          <Button
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(`Decline your offer of ${boxes(offer.offeredQty)}? This cannot be undone.`)
              ) {
                void run(() => shopApi.declineOffer(offer.id), 'Offer declined').then(
                  (ok) => ok && onChanged(),
                )
              }
            }}
          >
            Decline
          </Button>
        </div>
        {accepting && (
          <OfferModal
            round={r}
            onClose={() => setAccepting(false)}
            onDone={() => {
              setAccepting(false)
              onChanged()
            }}
          />
        )}
      </div>
    )
  }

  if (offer?.status === 'accepted') {
    const qty = boxes(offer.acceptedQty ?? offer.offeredQty)
    const order = r.myOrder
    const pay = order ? payStatus(order) : null
    const on = order?.paymentConfirmedAt ? ` on ${formatDate(order.paymentConfirmedAt)}` : ''
    // The shop's own order says where it is; the round can be further along for other shops.
    let text: string
    let tone: 'success' | 'primary' | 'danger' | 'neutral' = 'success'
    switch (order?.status) {
      case 'awaiting_deposit':
        text = order.paymentPending
          ? 'We received your deposit and are checking it. We will confirm it soon.'
          : 'Waiting for your deposit.'
        tone = 'neutral'
        break
      case 'awaiting_stock':
        text = `We confirmed your deposit${on}. We will ask for the balance when the stock arrives${
          r.expectedArrival ? ` (expected ${formatDate(r.expectedArrival)})` : ''
        }.`
        break
      case 'pending_payment':
        text = order.paymentPending
          ? 'We received your balance payment and are checking it. We will confirm it soon.'
          : `The stock has arrived: pay the balance of ${formatBaht(order.amountDue)}${
              order.shippingFee > 0 ? `, which includes ${formatBaht(order.shippingFee)} shipping,` : ''
            } by ${formatDeadline(order.paymentDueAt ?? r.paymentDeadline)}.`
        tone = order.paymentPending ? 'neutral' : 'primary'
        break
      case 'paid':
        text = `We confirmed your payment${on}. We ship ${r.shipDate ? `from ${formatDate(r.shipDate)}` : 'soon'}.`
        break
      case 'shipped':
        text = `Shipped ${formatDate(order.shippedAt)}${order.trackingNo ? ` · tracking ${order.trackingNo}` : ''}.`
        break
      case 'cancelled':
        text = `This order was cancelled${order.cancelReason ? `: ${order.cancelReason}` : ''}.`
        tone = 'danger'
        break
      default:
        text = r.status === 'closed' ? 'This pre-order is complete.' : ''
    }
    return (
      <Panel tone={tone}>
        <p className="font-semibold text-foreground">You accepted {qty}.</p>
        {text && <p>{text}</p>}
        <div className="mt-3 space-y-2">
          {pay &&
            r.myOrderId &&
            (pay.enabled ? (
              <Link to={PATHS.order(r.myOrderId)} className={cardButton.primary}>
                Pay the balance
              </Link>
            ) : (
              <button type="button" disabled className={cardButton.disabled}>
                {pay.confirmed && <span className="text-success">✓ </span>}
                {pay.label}
              </button>
            ))}
          {r.myOrderId && (
            <Link to={PATHS.order(r.myOrderId)} className={cardButton.outline}>
              View order
            </Link>
          )}
        </div>
      </Panel>
    )
  }

  const ended: Record<string, string> = {
    not_offered:
      'Demand was higher than our supply this time, so there were no boxes for you. Nothing to pay.',
    declined: 'You declined your offer.',
    expired: 'Your offer expired before it was accepted, so the boxes went back to the pool.',
  }
  return (
    <Panel>
      {(offer && ended[offer.status]) || 'Requests for this pre-order are closed. You did not request it.'}
    </Panel>
  )
}

/** Quantity stepper and "Request boxes", like "Add to cart" on a product page. */
function RequestForm({ round: r, onChanged }: { round: ShopRound; onChanged: (r?: ShopRound) => void }) {
  const { run } = useToast()
  const asked = r.myPreorder?.status === 'submitted' ? r.myPreorder : null
  const cap = r.maxPreorderQty ?? 999
  const [qty, setQty] = useState(asked?.requestedQty ?? 1)
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    await run(
      async () => onChanged(await shopApi.setPreorder(r.id, qty)),
      asked ? `Request changed to ${boxes(qty)}` : `Requested ${boxes(qty)}`,
    )
    setBusy(false)
  }

  async function withdraw() {
    if (!window.confirm('Withdraw your request? You can request again until the deadline.')) return
    setBusy(true)
    const ok = await run(async () => onChanged(await shopApi.withdrawPreorder(r.id)), 'Request withdrawn')
    if (ok) setQty(1)
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      {asked && (
        <Panel tone="success">
          <p className="font-semibold text-foreground">Your request: {boxes(asked.requestedQty)}</p>
          <p>Sent {formatDateTime(asked.updatedAt)}. You can change or withdraw it until the deadline.</p>
        </Panel>
      )}
      <div className="space-y-3">
        <p className="text-sm font-medium">Boxes to request</p>
        <QtyStepper value={qty} max={cap} onChange={setQty} label={r.title} className="w-40" />
        {r.maxPreorderQty != null && (
          <p className="text-xs text-muted-foreground">Up to {r.maxPreorderQty} for your tier.</p>
        )}
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy || asked?.requestedQty === qty}
          className={cn(
            asked?.requestedQty === qty ? cardButton.disabled : cardButton.primary,
            'py-3 text-base',
          )}
        >
          {asked == null
            ? `Request ${boxes(qty)}`
            : asked.requestedQty === qty
              ? 'Request sent'
              : `Change request to ${boxes(qty)}`}
        </button>
        {asked && (
          <button
            type="button"
            onClick={() => void withdraw()}
            disabled={busy}
            className="w-full py-2 text-sm text-muted-foreground hover:text-danger"
          >
            Withdraw request
          </button>
        )}
        <p className="text-xs text-muted-foreground">No payment now.</p>
      </div>
    </div>
  )
}

function Panel({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'primary' | 'danger'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'space-y-1 rounded-lg border px-4 py-3 text-sm text-muted-foreground',
        tone === 'neutral' && 'border-border bg-muted',
        tone === 'success' && 'border-success/30 bg-success/5',
        tone === 'primary' && 'border-primary/50 bg-primary/5',
        tone === 'danger' && 'border-danger/30 bg-danger/5 text-danger',
      )}
    >
      {children}
    </div>
  )
}

/** How the pre-order goes, step by step, with the round's dates; the current step is highlighted. */
function Steps({ round: r }: { round: ShopRound }) {
  const accepted = r.myAllocation?.status === 'accepted'
  const order = accepted ? r.myOrder : null
  // A shop with an order follows its own order; otherwise the round's stage.
  const byOrder: Record<string, number> = {
    awaiting_deposit: order?.paymentPending ? 3 : 2,
    awaiting_stock: 4,
    pending_payment: order?.paymentPending ? 6 : 5,
    paid: 7,
    shipped: 8,
    cancelled: -1,
  }
  const byRound: Record<string, number> = {
    open: 0,
    allocating: 1,
    offering: 1,
    confirmed: 4,
    balance_due: 5,
    closed: 8,
  }
  const current =
    r.status === 'cancelled' ? -1 : order ? (byOrder[order.status] ?? 0) : (byRound[r.status] ?? 0)
  const checkedBy = 'Slips are checked by hand; online payments right away'
  const steps: [string, string][] = [
    ['Request boxes', r.status === 'open' ? `Until ${formatDeadline(r.requestDeadline)}` : 'Requests closed'],
    [
      'Get your offer',
      r.offerDeadline
        ? `Accept by ${formatDeadline(r.offerDeadline)}`
        : `After requests close; ${Math.round(r.offerWindowHours / 24)} days to accept`,
    ],
    [`Pay the ${r.depositPct}% deposit`, 'When you accept the offer'],
    [
      'We confirm your deposit',
      order?.paymentConfirmedAt && current > 3
        ? `Confirmed ${formatDate(order.paymentConfirmedAt)}`
        : checkedBy,
    ],
    [
      'Stock arrives',
      r.arrivedAt
        ? `Arrived ${formatDate(r.arrivedAt)}`
        : r.expectedArrival
          ? `Expected ${formatDate(r.expectedArrival)}`
          : 'Date to be confirmed',
    ],
    [
      `Pay the ${100 - r.depositPct}% balance and shipping`,
      r.paymentDeadline ? `By ${formatDeadline(r.paymentDeadline)}` : 'Deadline set when stock arrives',
    ],
    [
      'We confirm your payment',
      order?.paymentConfirmedAt && current > 6
        ? `Confirmed ${formatDate(order.paymentConfirmedAt)}`
        : checkedBy,
    ],
    ['We ship', r.shipDate ? `From ${formatDate(r.shipDate)}` : 'Once the balance is confirmed'],
  ]

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <h2 className="text-sm font-semibold">How this pre-order works</h2>
      <ol className="space-y-0">
        {steps.map(([title, when], i) => (
          <li key={title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]',
                  i < current && 'border-success/40 bg-success/10 text-success',
                  i === current && 'border-primary bg-primary text-primary-foreground',
                  i > current && 'border-border bg-card text-muted-foreground',
                )}
                aria-current={i === current ? 'step' : undefined}
              >
                {i < current ? '✓' : i + 1}
              </span>
              {i < steps.length - 1 && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className={cn('text-sm', i === current ? 'font-semibold' : 'font-medium')}>{title}</p>
              <p className="text-xs text-muted-foreground">{when}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
