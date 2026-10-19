import type { ReactNode } from 'react'
import { TONE_CHIP_ACTIVE, type Tone } from '@/constants/tone'
import { cn } from '@/utils/cn'

/** Untoned "All" chip: orange tint when active. */
const DEFAULT_ACTIVE = 'text-primary-strong bg-primary/10 border-primary/40'

interface FilterChipProps {
  active: boolean
  onClick: () => void
  /** Omit for the neutral "All" chip. */
  tone?: Tone
  className?: string
  children: ReactNode
}

/** Toggleable filter tab; tinted with its tone when active. */
export function FilterChip({ active, onClick, tone, className, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded border px-3 py-1.5 font-mono text-[11px] whitespace-nowrap uppercase tracking-widest transition-colors',
        active
          ? tone
            ? TONE_CHIP_ACTIVE[tone]
            : DEFAULT_ACTIVE
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** A horizontally scrolling row of filter chips. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">{children}</div>
}
