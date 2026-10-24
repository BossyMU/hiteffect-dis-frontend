/**
 * Where shops send money. Shown with every slip payment: a PromptPay QR code with the amount
 * filled in, and the bank account.
 *
 * promptPay: the mobile number (e.g. 0812345678) or 13-digit tax ID the PromptPay account is
 * registered to.
 *
 * TEST DETAILS FOR NOW. Replace them with the real ones and set `testOnly` to false (that also
 * removes the "don't send money" notice). The PromptPay ID below can't belong to anyone: its last
 * digit fails the Thai ID check, so banking apps refuse it.
 */
export const PAYMENT_DETAILS = {
  testOnly: true,
  promptPay: '0000000000000',
  bankName: 'Test Bank',
  bankAccount: '000-0-00000-0',
  accountName: 'HIT EFFECT (TEST)',
}
