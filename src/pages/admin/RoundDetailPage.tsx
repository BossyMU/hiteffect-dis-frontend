import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { adminApi } from '@/api'
import {
  AllocationStatusBadge,
  Badge,
  Button,
  Card,
  DataTable,
  DetailList,
  LoadState,
  OrderStatusBadge,
  PageHeader,
  RoundStatusBadge,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from '@/components/ui'
import { ROUND_STATUS } from '@/constants/status'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { RoundAllocation, RoundDetail } from '@/types'
import { boxes, formatBaht, formatDate, formatDateTime, formatDeadline } from '@/utils/format'
import { RoundFormModal } from './components/RoundFormModal'
import { AdjustModal, ArriveModal, ScheduleModal } from './components/RoundModals'
import { RoundSteps } from './components/RoundSteps'
import { SupplyCard } from './components/SupplyCard'

type OpenModal = 'edit' | 'arrive' | 'schedule' | { adjust: RoundAllocation } | null

export default function RoundDetailPage() {
  const { id = '' } = useParams()
  const { run } = useToast()
  const { data: round, setData, status, error, reload } = useApiData(() => adminApi.round(id), [id])
  const [modal, setModal] = useState<OpenModal>(null)
  const [busy, setBusy] = useState(false)

  const saved = (r: RoundDetail) => {
    setData(r)
    setModal(null)
  }

  /** Run a status action that returns the round, after an optional confirmation. */
  async function act(action: () => Promise<unknown>, success: string, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return
    setBusy(true)
    await run(async () => {
      await action()
      await reload()
    }, success)
    setBusy(false)
  }

  /** Call the round off before offers go out. Shops that requested get the reason. */
  async function cancelRound(r: RoundDetail) {
    const note = window.prompt(
      `Cancel "${r.title}"? Shops that requested are notified. This cannot be undone.\n\nReason for shops (optional):`,
      '',
    )
    if (note === null) return
    setBusy(true)
    await run(async () => setData(await adminApi.cancelRound(r.id, note.trim())), 'Round cancelled')
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={round?.title ?? 'Round'}
        subtitle={round && `${round.productName} · ${round.productSku}`}
        back={{ to: PATHS.adminRounds, label: 'Rounds' }}
        actions={
          round &&
          !['closed', 'cancelled'].includes(round.status) && (
            <>
              {['draft', 'open', 'allocating'].includes(round.status) && (
                <Button variant="secondary" disabled={busy} onClick={() => void cancelRound(round)}>
                  Cancel round…
                </Button>
              )}
              <Button variant="secondary" onClick={() => setModal('edit')}>
                Edit
              </Button>
            </>
          )
        }
      />
      <LoadState status={status} error={error} onRetry={reload}>
        {round && (
          <>
            <RoundSteps status={round.status} />

            <Card className="space-y-4 border-primary/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RoundStatusBadge status={round.status} />
                    {round.stats.pendingDeposits > 0 && (
                      <Link to={PATHS.adminPayments}>
                        <Badge tone="warning">{round.stats.pendingDeposits} deposit slip(s) to check</Badge>
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {round.status === 'allocating' && round.totalSupply == null
                      ? 'Requests are closed. Enter the supply the publisher confirms to calculate the offers.'
                      : round.status === 'allocating' && !calculated(round)
                        ? 'Requests are closed. Calculate the offers, review them, then publish.'
                        : ROUND_STATUS[round.status].help}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <NextActions round={round} busy={busy} act={act} openModal={setModal} />
                </div>
              </div>
              <DetailList
                items={[
                  ['Request deadline', formatDeadline(round.requestDeadline)],
                  ['Offer deadline', formatDeadline(round.offerDeadline)],
                  ['Expected arrival', formatDate(round.expectedArrival)],
                  ['Payment deadline', formatDeadline(round.paymentDeadline)],
                  ['Ship date', formatDate(round.shipDate)],
                  ['Deposit', `${round.depositPct}% · offer window ${round.offerWindowHours / 24} days`],
                ]}
              />
            </Card>

            <SupplyCard round={round} />

            <StatGrid className="lg:grid-cols-5">
              <StatCard
                label="Supply"
                value={round.totalSupply == null ? '—' : String(round.totalSupply)}
                sub={
                  round.receivedQty != null
                    ? `${round.receivedQty} arrived`
                    : round.totalSupply == null
                      ? 'not set yet'
                      : 'boxes expected'
                }
              />
              <StatCard
                label="Requested"
                value={String(round.stats.requestedTotal)}
                sub={`${round.stats.preorderCount} shops`}
              />
              <StatCard label="Offered" value={String(round.stats.offeredTotal)} />
              <StatCard label="Accepted" value={String(round.stats.acceptedTotal)} accent />
              <StatCard label="Open orders" value={String(round.stats.openOrders)} />
            </StatGrid>

            {round.allocations.length > 0 ? (
              <AllocationTable round={round} onAdjust={(a) => setModal({ adjust: a })} />
            ) : (
              <RequestTable round={round} />
            )}

            {round.adjustments.length > 0 && (
              <div className="space-y-3">
                <SectionTitle>Manual changes</SectionTitle>
                <DataTable headers={['When', 'Shop', 'Change', 'Reason', 'By']}>
                  {round.adjustments.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(j.createdAt)}
                      </TableCell>
                      <TableCell>{j.shopName}</TableCell>
                      <TableCell className="font-mono">
                        {j.delta > 0 ? '+' : ''}
                        {j.delta}{' '}
                        <span className="text-xs text-muted-foreground">{j.type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className="text-sm">{j.reason}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{j.adminEmail}</TableCell>
                    </TableRow>
                  ))}
                </DataTable>
              </div>
            )}

            <div className="space-y-3">
              <SectionTitle>History</SectionTitle>
              <Card>
                <ol className="space-y-2 text-sm">
                  {round.history.map((h) => (
                    <li key={h.id} className="flex flex-wrap gap-x-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(h.changedAt)}
                      </span>
                      <span className="font-medium">{ROUND_STATUS[h.toStatus].label}</span>
                      {h.note && <span className="text-muted-foreground">{h.note}</span>}
                      <span className="text-xs text-muted-foreground">by {h.changedBy}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </>
        )}
      </LoadState>

      {round && modal === 'edit' && (
        <RoundFormModal
          round={round}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            void reload()
          }}
        />
      )}
      {round && modal === 'arrive' && (
        <ArriveModal round={round} onClose={() => setModal(null)} onSaved={saved} />
      )}
      {round && modal === 'schedule' && (
        <ScheduleModal round={round} onClose={() => setModal(null)} onSaved={saved} />
      )}
      {round && modal && typeof modal === 'object' && (
        <AdjustModal round={round} allocation={modal.adjust} onClose={() => setModal(null)} onSaved={saved} />
      )}
    </div>
  )
}

function NextActions({
  round,
  busy,
  act,
  openModal,
}: {
  round: RoundDetail
  busy: boolean
  act: (action: () => Promise<unknown>, success: string, confirm?: string) => Promise<void>
  openModal: (m: OpenModal) => void
}) {
  switch (round.status) {
    case 'draft':
      return (
        <Button
          disabled={busy}
          onClick={() =>
            void act(
              () => adminApi.openRound(round.id),
              'Round open; shops have been notified',
              'Open this round? Every active shop is notified.',
            )
          }
        >
          Open for requests
        </Button>
      )
    case 'open':
      return round.totalSupply == null ? (
        <Button
          disabled={busy}
          onClick={() =>
            void act(
              () => adminApi.allocate(round.id),
              'Requests closed',
              'Close requests now? Offers are calculated once you enter the supply. (Requests also close on their own at the deadline.)',
            )
          }
        >
          Close requests
        </Button>
      ) : (
        <Button
          disabled={busy}
          onClick={() =>
            void act(
              () => adminApi.allocate(round.id),
              'Requests closed and offers calculated',
              'Close requests now and calculate offers? (This also happens on its own at the request deadline.)',
            )
          }
        >
          Close requests &amp; calculate
        </Button>
      )
    case 'allocating':
      if (round.totalSupply == null) {
        return <Button onClick={() => openModal('edit')}>Enter supply</Button>
      }
      if (!calculated(round)) {
        return (
          <Button
            disabled={busy}
            onClick={() => void act(() => adminApi.allocate(round.id), 'Offers calculated')}
          >
            Calculate offers
          </Button>
        )
      }
      return (
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              void act(
                () => adminApi.allocate(round.id),
                'Offers recalculated',
                'Recalculate? Manual changes are replaced.',
              )
            }
          >
            Recalculate
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              void act(
                () => adminApi.publish(round.id),
                'Offers published; shops have been notified',
                'Publish the offers to shops now?',
              )
            }
          >
            Publish offers
          </Button>
        </>
      )
    case 'offering':
      return (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void act(
              () => adminApi.closeOffers(round.id),
              'Offers closed',
              'Close offers now? Unanswered offers expire. (This also happens on its own at the offer deadline.)',
            )
          }
        >
          Close offers now
        </Button>
      )
    case 'confirmed':
      return (
        <>
          <Button variant="secondary" onClick={() => openModal('schedule')}>
            Change expected arrival
          </Button>
          <Button onClick={() => openModal('arrive')}>Stock arrived…</Button>
        </>
      )
    case 'balance_due':
      return (
        <>
          <Button variant="secondary" onClick={() => openModal('schedule')}>
            Change dates
          </Button>
          <Button
            disabled={busy}
            onClick={() => void act(() => adminApi.closeRound(round.id), 'Round closed', 'Close this round?')}
          >
            Close round
          </Button>
        </>
      )
    default:
      return null
  }
}

function RequestTable({ round }: { round: RoundDetail }) {
  return (
    <div className="space-y-3">
      <SectionTitle>Requests</SectionTitle>
      <DataTable
        headers={['Shop', 'Tier', 'Boxes', 'Status', 'Terms agreed', 'Last change']}
        isEmpty={round.preorders.length === 0}
        emptyMessage={round.status === 'draft' ? 'Open the round so shops can request.' : 'No requests yet.'}
      >
        {round.preorders.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.shopName}</TableCell>
            <TableCell className="text-sm">{p.tierName ?? '—'}</TableCell>
            <TableCell className="font-mono">{p.requestedQty}</TableCell>
            <TableCell>
              <Badge tone={p.status === 'submitted' ? 'info' : 'neutral'}>
                {p.status === 'submitted' ? 'Requested' : 'Withdrawn'}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {p.termsAcceptedAt ? (
                <span title={`Version ${p.termsVersion}`}>✓ {formatDateTime(p.termsAcceptedAt)}</span>
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {formatDateTime(p.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </div>
  )
}

function AllocationTable({
  round,
  onAdjust,
}: {
  round: RoundDetail
  onAdjust: (a: RoundAllocation) => void
}) {
  const canAdjust = (a: RoundAllocation) =>
    (round.status === 'allocating' || round.status === 'offering') &&
    ['draft', 'not_offered', 'offered'].includes(a.status)

  return (
    <div className="space-y-3">
      <SectionTitle>Offers</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Weight = tier weight × purchase history bonus. Small requests are filled first; bigger ones share the
        rest by weight. Total offered: {boxes(round.stats.offeredTotal)} of {round.totalSupply}.
      </p>
      <DataTable
        headers={[
          'Shop',
          'Tier',
          'Weight',
          'Requested',
          'Offered',
          'Accepted',
          'Price',
          'Status',
          'Order',
          '',
        ]}
      >
        {round.allocations.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.shopName}</TableCell>
            <TableCell className="text-sm">{a.tierName ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">×{a.weight}</TableCell>
            <TableCell className="font-mono">{a.requestedQty}</TableCell>
            <TableCell className="font-mono font-semibold">{a.offeredQty}</TableCell>
            <TableCell className="font-mono">{a.acceptedQty ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">{formatBaht(a.unitPrice)}</TableCell>
            <TableCell>
              <AllocationStatusBadge status={a.status} />
            </TableCell>
            <TableCell>
              {a.orderNo && a.orderStatus && (
                <div className="space-y-1">
                  <p className="font-mono text-xs">{a.orderNo}</p>
                  <OrderStatusBadge status={a.orderStatus} />
                </div>
              )}
            </TableCell>
            <TableCell>
              {canAdjust(a) && (
                <Button size="sm" variant="soft" onClick={() => onAdjust(a)}>
                  Change
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
    </div>
  )
}

/** Offers have been calculated (or there were no requests to calculate). */
function calculated(round: RoundDetail) {
  return round.allocations.length > 0 || round.stats.preorderCount === 0
}
