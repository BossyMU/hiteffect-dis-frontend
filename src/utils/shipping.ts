import type { ShippingQuote } from '@/types'

/** "3.9 kg", "850 g". */
export const formatWeight = (grams: number) =>
  grams >= 1000 ? `${(grams / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })} kg` : `${grams} g`

/** "EMS · 1 parcel, 3.9 kg": the short line next to a shipping amount. */
export function shippingSummary(q: ShippingQuote) {
  const n = q.parcels.length
  return `EMS · ${n} ${n === 1 ? 'parcel' : 'parcels'}, ${formatWeight(q.totalGrams)}`
}
