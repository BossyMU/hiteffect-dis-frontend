import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { adminApi } from '@/api'
import {
  Button,
  DataTable,
  FilterBar,
  FilterChip,
  LoadState,
  PageHeader,
  RoundStatusBadge,
  TableCell,
  TableRow,
} from '@/components/ui'
import { ROUND_STATUS, ROUND_STEPS } from '@/constants/status'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { AdminRound, RoundStatus } from '@/types'
import { formatDate, formatDeadline } from '@/utils/format'
import { RoundFormModal } from './components/RoundFormModal'
import { supplyView } from './supply'

/** The date that matters next for a round. */
function nextDate(r: AdminRound) {
  switch (r.status) {
    case 'open':
      return `Requests close ${formatDeadline(r.requestDeadline)}`
    case 'offering':
      return `Offers close ${formatDeadline(r.offerDeadline)}`
    case 'confirmed':
      return `Arrives ~${formatDate(r.expectedArrival)}`
    case 'balance_due':
      return `Payment due ${formatDeadline(r.paymentDeadline)}`
    default:
      return '—'
  }
}

export default function RoundsPage() {
  const navigate = useNavigate()
  const { data, status, error, reload } = useApiData(() => adminApi.rounds())
  const [filter, setFilter] = useState<RoundStatus | 'active' | 'all'>('active')
  const [creating, setCreating] = useState(false)
  const rounds = useMemo(() => data ?? [], [data])
  const match = (r: AdminRound, f: typeof filter) =>
    f === 'all' ? true : f === 'active' ? !['closed', 'cancelled'].includes(r.status) : r.status === f

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pre-order rounds"
        subtitle="One round per release"
        actions={<Button onClick={() => setCreating(true)}>+ New round</Button>}
      />
      <FilterBar>
        {(['active', 'all', ...ROUND_STEPS, 'cancelled'] as const).map((f) => (
          <FilterChip
            key={f}
            tone={f === 'active' || f === 'all' ? undefined : ROUND_STATUS[f].tone}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'active' ? 'Active' : f === 'all' ? 'All' : ROUND_STATUS[f].label}
            <span className="ml-1 opacity-60">{rounds.filter((r) => match(r, f)).length}</span>
          </FilterChip>
        ))}
      </FilterBar>
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Round', 'Status', 'Supply', 'Left', 'Requested', 'Offered', 'Accepted', 'Next']}
          isEmpty={rounds.filter((r) => match(r, filter)).length === 0}
          emptyMessage="No rounds here yet."
        >
          {rounds
            .filter((r) => match(r, filter))
            .map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(PATHS.adminRound(r.id))}
              >
                <TableCell>
                  <p className="font-medium">{r.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.productSku}</p>
                </TableCell>
                <TableCell>
                  <RoundStatusBadge status={r.status} />
                  {r.stats.pendingDeposits > 0 && (
                    <p className="mt-1 text-xs text-warning">{r.stats.pendingDeposits} slip(s) to check</p>
                  )}
                </TableCell>
                <TableCell className="font-mono">{r.totalSupply}</TableCell>
                <TableCell>
                  <SupplyLeft round={r} />
                </TableCell>
                <TableCell className="font-mono">
                  {r.stats.requestedTotal}
                  <span className="text-xs text-muted-foreground"> · {r.stats.preorderCount} shops</span>
                </TableCell>
                <TableCell className="font-mono">{r.stats.offeredTotal}</TableCell>
                <TableCell className="font-mono">{r.stats.acceptedTotal}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{nextDate(r)}</TableCell>
              </TableRow>
            ))}
        </DataTable>
      </LoadState>
      {creating && (
        <RoundFormModal
          onClose={() => setCreating(false)}
          onSaved={(r) => {
            setCreating(false)
            navigate(PATHS.adminRound(r.id))
          }}
        />
      )}
    </div>
  )
}

/** Boxes of the supply still free, with a tiny bar: how full the round is at a glance. */
function SupplyLeft({ round }: { round: AdminRound }) {
  const v = supplyView(round)
  if (round.status === 'cancelled') return <span className="text-muted-foreground">—</span>
  const usedPct = v.supply > 0 ? Math.min(100, ((v.supply - v.left) / v.supply) * 100) : 0
  return (
    <div className="min-w-16" title={`${v.left} of ${v.supply} boxes left: ${v.leftLabel}`}>
      <p className="font-mono">
        {v.left}
        {v.over > 0 && <span className="text-xs text-warning"> · +{v.over} over</span>}
      </p>
      <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-foreground/50" style={{ width: `${usedPct}%` }} />
      </div>
    </div>
  )
}
