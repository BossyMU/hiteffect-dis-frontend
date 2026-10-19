import { APP_TIMEZONE } from './date'

/** Format a number as Thai Baht, e.g. 32000 → "฿32,000", 1234.5 → "฿1,234.50". */
export const formatBaht = (n: number) =>
  `฿${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIMEZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/** "16 Oct 2026", from a 'YYYY-MM-DD' date or an ISO timestamp. */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = value.length === 10 ? new Date(`${value}T12:00:00+07:00`) : new Date(value)
  return dateFormat.format(date)
}

/** "16 Oct, 14:05" in Bangkok time. */
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? dateTimeFormat.format(new Date(iso)) : '—'

/** A deadline shown to shops: "23:59, 16 Oct 2026". Every deadline ends at 23:59 Bangkok time. */
export const formatDeadline = (iso: string | null | undefined) => (iso ? `23:59, ${formatDate(iso)}` : '—')

/** "3 boxes", "1 box". */
export const boxes = (n: number) => `${n.toLocaleString()} ${n === 1 ? 'box' : 'boxes'}`
