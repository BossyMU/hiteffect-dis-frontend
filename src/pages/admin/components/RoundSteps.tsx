import { ROUND_STATUS, ROUND_STEPS } from '@/constants/status'
import type { RoundStatus } from '@/types'
import { cn } from '@/utils/cn'

/** The round's lifecycle as a row of steps, with the current one highlighted. */
export function RoundSteps({ status }: { status: RoundStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="inline-block rounded-full border border-danger/30 bg-danger/5 px-3 py-1 font-mono text-[11px] tracking-wider text-danger uppercase">
        Cancelled
      </p>
    )
  }
  const current = ROUND_STEPS.indexOf(status)
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Round progress">
      {ROUND_STEPS.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider',
            i < current && 'border-success/30 bg-success/5 text-success',
            i === current && 'border-primary bg-primary text-primary-foreground',
            i > current && 'border-border bg-card text-muted-foreground',
          )}
        >
          {i < current ? '✓ ' : ''}
          {ROUND_STATUS[s].label}
        </li>
      ))}
    </ol>
  )
}
