/**
 * The text inside a PromptPay QR code (Thai QR Payment, EMVCo merchant-presented format), with the
 * amount filled in so the shop only scans and confirms. Any Thai banking app reads it.
 * Same output as the `promptpay-qr` package.
 */

/** One EMVCo field: id, two-digit length, value. */
const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`

/** CRC-16/CCITT-FALSE (polynomial 0x1021, start 0xFFFF), as four upper-case hex digits. */
function crc16(text: string) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * The PromptPay account field: a mobile number (10 digits, 0…), a tax or citizen ID (13 digits),
 * or an e-wallet ID (15 digits). `null` when the ID is none of these.
 */
function accountField(promptPayId: string) {
  const digits = promptPayId.replace(/\D/g, '')
  if (digits.length === 15) return field('03', digits)
  if (digits.length === 13) return field('02', digits)
  // Mobile numbers go in as 0066 + the number without its leading 0.
  if (digits.length === 10 && digits.startsWith('0')) return field('01', `0066${digits.slice(1)}`)
  return null
}

/** True when `promptPayId` is a mobile number, tax/citizen ID or e-wallet ID PromptPay accepts. */
export const isPromptPayId = (promptPayId: string) => accountField(promptPayId) !== null

/**
 * QR code text for paying `amount` baht to `promptPayId`. Without an amount the shop types it in.
 * @returns `null` when the PromptPay ID isn't valid
 */
export function promptPayPayload(promptPayId: string, amount?: number): string | null {
  const account = accountField(promptPayId)
  if (!account) return null
  const withAmount = amount !== undefined && amount > 0
  const data =
    field('00', '01') +
    field('01', withAmount ? '12' : '11') + // 12: for this payment only, 11: reusable
    field('29', field('00', 'A000000677010111') + account) + // PromptPay
    field('58', 'TH') +
    field('53', '764') + // baht
    (withAmount ? field('54', amount.toFixed(2)) : '')
  return `${data}6304${crc16(`${data}6304`)}`
}
