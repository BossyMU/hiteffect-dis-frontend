/**
 * Thailand Post tracking numbers are UPU S10 codes, e.g. EB123456785TH: 2 letters, 8 digits, a check
 * digit, 2 letters. Same check as the backend (src/shipping/thaipost.js), so staff see a typo at once.
 */
const WEIGHTS = [8, 6, 4, 2, 3, 5, 9, 7]

/** "eb 1234 5678 5th" → "EB123456785TH" */
export const normalizeTrackingNo = (value: string) => value.replace(/[\s-]/g, '').toUpperCase()

/** True for a well-formed tracking number with the right check digit. */
export function isValidTrackingNo(value: string) {
  const match = normalizeTrackingNo(value).match(/^[A-Z]{2}(\d{8})(\d)[A-Z]{2}$/)
  if (!match) return false
  const sum = [...match[1]].reduce((acc, d, i) => acc + Number(d) * WEIGHTS[i], 0)
  const check = 11 - (sum % 11)
  return (check === 10 ? 0 : check === 11 ? 5 : check) === Number(match[2])
}
