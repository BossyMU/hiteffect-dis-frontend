import { Card, SectionTitle } from '@/components/ui'
import type { AdminRound } from '@/types'
import { cn } from '@/utils/cn'
import { supplyView, type SupplyPart } from '../supply'

/** Fill per part. The unfilled track is what's left. Labels and numbers carry the meaning, not color. */
const FILL: Record<SupplyPart['key'], string> = {
  accepted: 'bg-success',
  waiting: 'bg-warning',
  planned: 'bg-info',
  requested: 'bg-info',
}

/**
 * How many boxes of the round's supply are left: a big number, and a bar of the supply split into
 * what's taken (accepted, waiting for an answer, …) and what's left (the empty track).
 */
export function SupplyCard({ round }: { round: AdminRound }) {
  const v = supplyView(round)
  const scale = Math.max(v.supply, 1)
  // When requests go over the supply, the bar is full and the overflow is said in words.
  const shown = v.parts.map((p) => ({ ...p, width: Math.min(p.qty, v.supply) / scale }))

  return (
    <Card className="space-y-4">
      <SectionTitle>Supply</SectionTitle>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-3xl font-semibold">{v.left}</p>
        <p className="text-sm text-muted-foreground">
          of {v.supply} boxes left · {v.leftLabel}
          {round.receivedQty != null && round.receivedQty !== round.totalSupply && (
            <>
              {' '}
              ({round.receivedQty} arrived of {round.totalSupply} expected)
            </>
          )}
        </p>
      </div>
      {v.over > 0 && (
        <p className="text-sm font-medium text-warning">
          Requests go over the supply by {v.over} boxes. Offers will be shared out by weight.
        </p>
      )}

      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${[...v.parts.map((p) => `${p.label} ${p.qty}`), `Left ${v.left}`].join(', ')} of ${v.supply} boxes`}
      >
        {shown
          .filter((p) => p.width > 0)
          .map((p) => (
            <div
              key={p.key}
              // A 2px gap in the card's color between parts, and before what's left.
              className={cn('h-full border-r-2 border-card', FILL[p.key])}
              style={{ width: `${p.width * 100}%` }}
              title={`${p.label}: ${p.qty} boxes`}
            />
          ))}
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {v.parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-sm', FILL[p.key])} aria-hidden />
            <span className="text-muted-foreground">{p.label}</span>
            <span className="font-mono font-semibold">{p.qty}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-muted" aria-hidden />
          <span className="text-muted-foreground">Left</span>
          <span className="font-mono font-semibold">{v.left}</span>
        </li>
      </ul>
    </Card>
  )
}
