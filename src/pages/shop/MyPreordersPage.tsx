import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { shopApi } from '@/api'
import { FilterBar, FilterChip, LoadState, PageHeader } from '@/components/ui'
import { PATHS } from '@/routes/paths'
import { useApiData } from '@/hooks/useApiData'
import type { ShopRound } from '@/types'
import { cn } from '@/utils/cn'
import { formatBaht } from '@/utils/format'
import { useCatalogParams } from './catalog'
import { cardButton } from './components/cardButton'
import { ImageBadge, ProductImage } from './components/ProductImage'
import { TRACK_STEPS, isMine, preorderState, trackState, type TrackStage } from './preorderState'

const CHIPS: Record<TrackStage, string> = {
  action: 'Needs action',
  progress: 'In progress',
  done: 'Finished',
}
const STAGE_ORDER: TrackStage[] = ['action', 'progress', 'done']

/**
 * My pre-orders (in the shop menu): every pre-order the shop took part in, from request to shipping, with
 * where it is now, what it asked for, was offered and accepted, what is paid and what is due.
 */
export default function MyPreordersPage() {
  const params = useCatalogParams()
  const { data, status, error, reload } = useApiData(() => shopApi.rounds())

  const mine = useMemo(() => {
    const rows = (data ?? []).filter(isMine).map((round) => ({ round, track: trackState(round) }))
    // Needs action first, then in progress, then finished; the API's order within each.
    return STAGE_ORDER.flatMap((stage) => rows.filter((x) => x.track.stage === stage))
  }, [data])
  const chip = (params.show in CHIPS ? params.show : '') as TrackStage | ''
  const shown = chip ? mine.filter((x) => x.track.stage === chip) : mine

  return (
    <div className="space-y-5">
      <PageHeader title="My pre-orders" subtitle="Your pre-orders, from request to shipping" />
      <FilterBar>
        {STAGE_ORDER.map((k) => (
          <FilterChip
            key={k}
            tone={k === 'action' ? 'primary' : undefined}
            active={chip === k}
            onClick={() => params.update({ show: chip === k ? null : k })}
          >
            {CHIPS[k]}{' '}
            <span className="ml-1 opacity-60">{mine.filter((x) => x.track.stage === k).length}</span>
          </FilterChip>
        ))}
      </FilterBar>

      <LoadState status={status} error={error} onRetry={reload}>
        {shown.length === 0 ? (
          <div className="space-y-2 py-16 text-center text-sm text-muted-foreground">
            <p>
              {chip === 'action'
                ? 'Nothing needs your action right now.'
                : mine.length === 0
                  ? "You haven't requested any pre-orders yet."
                  : 'Nothing here.'}
            </p>
            {mine.length === 0 && (
              <Link to={PATHS.preorders} className="font-semibold text-info hover:underline">
                See what's open for pre-order →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {shown.map(({ round, track }) => (
              <TrackCard key={round.id} round={round} track={track} />
            ))}
          </ul>
        )}
      </LoadState>
    </div>
  )
}

function TrackCard({ round: r, track }: { round: ShopRound; track: ReturnType<typeof trackState> }) {
  const location = useLocation()
  const badge = preorderState(r)
  const asked = r.myPreorder?.status === 'submitted' ? r.myPreorder.requestedQty : null
  const offer = r.myAllocation
  const order = r.myOrder
  const to = PATHS.preorder(r.id)
  const actionTo = track.action.to === 'order' && order ? PATHS.order(order.id) : to
  const state = { from: location.pathname + location.search }

  return (
    <li
      className={cn(
        'rounded-xl border bg-card p-4 shadow-[0_8px_24px_rgba(23,26,31,0.06)] md:p-5',
        track.stage === 'action' ? 'border-primary/50' : 'border-border',
      )}
    >
      <div className="flex gap-4">
        <Link to={to} state={state} className="w-20 shrink-0 md:w-24">
          <ProductImage
            src={r.productImageUrl}
            alt={r.productName}
            setCode={r.productSetCode}
            game={r.productGame}
            className="[&_img]:p-2"
          />
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">
                {r.productSku}
                {order && ` · ${order.orderNo}`}
              </p>
              <Link to={to} state={state} className="font-medium hover:underline">
                {r.title}
              </Link>
            </div>
            <ImageBadge tone={badge.badgeTone}>{badge.badge}</ImageBadge>
          </div>
          <p className="text-sm">{track.next}</p>
        </div>
      </div>

      <Tracker current={track.current} stopped={track.stopped} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
          <Fact label="Requested" value={asked ?? '—'} />
          <Fact label="Offered" value={offer ? offer.offeredQty : '—'} />
          <Fact label="Accepted" value={offer?.acceptedQty ?? '—'} />
          <Fact
            label={`Deposit ${r.depositPct}%`}
            value={
              order
                ? `${formatBaht(order.depositAmount)}${order.status === 'awaiting_deposit' ? ' · checking' : order.paidAmount >= order.depositAmount ? ' · paid' : ''}`
                : '—'
            }
          />
          <Fact
            label="Balance"
            value={
              !order || order.status === 'cancelled'
                ? '—'
                : order.amountDue === 0
                  ? 'Paid'
                  : `${formatBaht(order.amountDue)}${order.status === 'pending_payment' ? ' due' : ' later'}`
            }
          />
        </dl>
        <Link
          to={actionTo}
          state={state}
          className={cn(
            track.action.urgent ? cardButton.primary : cardButton.outline,
            'w-full px-6 sm:w-auto',
          )}
        >
          {track.action.label}
        </Link>
      </div>
    </li>
  )
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 font-mono">{value}</dd>
    </div>
  )
}

/** Request → Offer → Deposit → Stock → Balance → Shipped, with the current step lit. */
function Tracker({ current, stopped }: { current: number; stopped: boolean }) {
  return (
    <ol className="mt-4 grid grid-cols-6 gap-1" aria-label="Progress">
      {TRACK_STEPS.map((label, i) => {
        const done = i < current
        const now = i === current && !stopped
        const end = i === current && stopped
        return (
          <li key={label} className="min-w-0" aria-current={now ? 'step' : undefined}>
            <div
              className={cn(
                'h-1.5 rounded-full',
                done && 'bg-success',
                now && 'bg-primary',
                end && 'bg-muted-foreground/40',
                !done && !now && !end && 'bg-muted',
              )}
            />
            <p
              className={cn(
                'mt-1.5 truncate text-[11px]',
                now ? 'font-semibold text-foreground' : done ? 'text-success' : 'text-muted-foreground',
                end && 'line-through',
              )}
              title={label}
            >
              {label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
