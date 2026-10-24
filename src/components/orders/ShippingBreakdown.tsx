import type { ShippingQuote } from '@/types'
import { cn } from '@/utils/cn'
import { formatBaht } from '@/utils/format'
import { formatWeight } from '@/utils/shipping'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * How shipping was worked out, folded away by default: each parcel's EMS postage, the surcharges,
 * what Thailand Post charges in all, and our service fee on top.
 */
export function ShippingBreakdown({ quote: q, className }: { quote: ShippingQuote; className?: string }) {
  const perParcel = (each: number) =>
    q.parcels.length > 1 ? ` (${formatBaht(each)} × ${q.parcels.length})` : ''
  const fuelEach = q.parcels.length ? q.fuelSurcharge / q.parcels.length : 0
  const remoteEach = q.parcels.length ? q.remoteSurcharge / q.parcels.length : 0

  return (
    <details className={cn('group text-sm', className)}>
      <summary className="cursor-pointer text-xs font-medium text-info select-none hover:underline">
        How shipping is worked out
      </summary>
      <dl className="mt-2 space-y-1 rounded-lg bg-muted px-3 py-2.5 text-xs">
        {q.parcels.map((p, i) => (
          <Line
            key={i}
            label={`${q.parcels.length > 1 ? `Parcel ${i + 1}: ` : 'EMS postage: '}${plural(p.boxes, 'box', 'boxes')}, ${formatWeight(p.grams)} with packing`}
            value={p.postage}
          />
        ))}
        <Line label={`Fuel surcharge${perParcel(fuelEach)}`} value={q.fuelSurcharge} />
        {q.remote && (
          <Line
            label={`Remote area, postcode ${q.postcode}${perParcel(remoteEach)}`}
            value={q.remoteSurcharge}
          />
        )}
        <Line label="Thailand Post EMS" value={q.carrierCost} strong />
        <Line label={`Service fee (${q.serviceFeePct}%)`} value={q.serviceFee} />
        <Line label="Shipping" value={q.total} strong />
      </dl>
      {q.defaultWeightUsed && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Some boxes have no weight on file yet, so a standard box weight was used.
        </p>
      )}
    </details>
  )
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div
      className={cn(
        'flex justify-between gap-3',
        strong ? 'border-t border-border pt-1 font-semibold' : 'text-muted-foreground',
      )}
    >
      <dt>{label}</dt>
      <dd className="font-mono whitespace-nowrap">{formatBaht(value)}</dd>
    </div>
  )
}
