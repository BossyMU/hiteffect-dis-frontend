/**
 * CSV files for Excel and Google Sheets: UTF-8 with a byte-order mark (so Excel shows Thai), comma
 * separated, CRLF line ends, fields quoted when needed. Text that Excel would run as a formula
 * (starting with = + - @) gets a leading apostrophe, so a shop name can't become a formula.
 */
export type CsvValue = string | number | null | undefined

function cell(value: CsvValue) {
  if (value == null) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  let text = value
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: CsvValue[][]) {
  return '﻿' + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Save the rows as a .csv file in the browser's downloads. */
export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]) {
  const url = URL.createObjectURL(new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const bangkok = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "2026-11-06 10:35" in Bangkok time (Excel reads it as a date), or '' when there is none. */
export const csvDateTime = (iso: string | null | undefined) => (iso ? bangkok.format(new Date(iso)) : '')

/** Today in Bangkok, for file names: "2026-11-06". */
export const csvToday = () => csvDateTime(new Date().toISOString()).slice(0, 10)
