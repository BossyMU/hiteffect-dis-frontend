import { cn } from '@/utils/cn'
import { formatBaht } from '@/utils/format'

export type PayBy = 'online' | 'slip'

const CHOICES: { value: PayBy; title: string; text: string }[] = [
  {
    value: 'online',
    title: 'Pay online',
    text: "PromptPay QR or card on Xendit's secure page. Confirmed right away.",
  },
  {
    value: 'slip',
    title: 'Transfer and send slip',
    text: 'Pay by PromptPay or bank transfer yourself, then attach the slip. We check it by hand.',
  },
]

/** Pick how to pay: online with Xendit, or by transfer slip. */
export function PayMethodChoice({ value, onChange }: { value: PayBy; onChange: (value: PayBy) => void }) {
  return (
    <div role="radiogroup" aria-label="How to pay" className="grid gap-2 sm:grid-cols-2">
      {CHOICES.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value === c.value}
          onClick={() => onChange(c.value)}
          className={cn(
            'rounded-lg border px-4 py-3 text-left text-sm transition-colors',
            value === c.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card hover:border-primary/40',
          )}
        >
          <span className="font-semibold">{c.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{c.text}</span>
        </button>
      ))}
    </div>
  )
}

/** What happens when the shop pays online. */
export function OnlinePayNote({ amount }: { amount: number }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p>
        You'll go to Xendit's payment page to pay{' '}
        <span className="font-mono font-semibold">{formatBaht(amount)}</span>, then come back here.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        The page stays open for a few minutes. If you don't finish, nothing is charged and you can try again.
      </p>
    </div>
  )
}
