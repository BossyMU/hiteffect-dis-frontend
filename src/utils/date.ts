/** Business timezone; must match the backend's APP_TIMEZONE so both agree on "today" and on deadlines. */
export const APP_TIMEZONE = 'Asia/Bangkok'

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE })

/** Today's date as YYYY-MM-DD in the business timezone. */
export const today = () => ymd.format(new Date())

/** 'YYYY-MM-DD' plus `days` days. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The 'YYYY-MM-DD' (business timezone) of an ISO timestamp, e.g. for a date input. */
export const toDateInput = (iso: string | null | undefined) => (iso ? ymd.format(new Date(iso)) : '')
