import { useState } from 'react'
import { cn } from '@/utils/cn'

interface QtyStepperProps {
  value: number
  onChange: (qty: number) => void
  min?: number
  max?: number
  /** What the − / + buttons change, for screen readers ("Booster Box"). */
  label: string
  /** Text shown between the buttons instead of the number field ("2 in cart"). */
  text?: string
  className?: string
}

/** − [qty] + control, as on a storefront. Typing a number works too; it is clamped to min…max on blur. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  label,
  text,
  className,
}: QtyStepperProps) {
  // What the shop is typing; null when not typing, so the field shows `value`.
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    const n = Math.floor(Number(raw))
    const next = raw.trim() !== '' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : value
    setDraft(null)
    if (next !== value) onChange(next)
  }

  const step = 'flex h-11 w-11 shrink-0 items-center justify-center text-lg transition disabled:opacity-30'
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border',
        text ? 'border-primary bg-primary/5' : 'border-border bg-card',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`One fewer ${label}`}
        className={step}
        disabled={!text && value <= min}
        onClick={() => onChange(Math.max(text ? 0 : min, value - 1))}
      >
        −
      </button>
      {text ? (
        <span className="font-mono text-sm font-semibold" aria-live="polite">
          {text}
        </span>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          aria-label={`Quantity of ${label}`}
          min={min}
          max={Number.isFinite(max) ? max : undefined}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
          className="w-16 [appearance:textfield] bg-transparent text-center font-mono text-base font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      )}
      <button
        type="button"
        aria-label={`One more ${label}`}
        className={step}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}
