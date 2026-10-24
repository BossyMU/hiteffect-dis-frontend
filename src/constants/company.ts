/**
 * Where shops send money. Shown with every slip payment: a PromptPay QR code with the amount
 * filled in, and the bank account. Fill these in with your real details.
 *
 * promptPay: the mobile number (e.g. 0812345678) or 13-digit tax ID the PromptPay account is
 * registered to. Until these are filled in, the payment window says they aren't set up yet.
 */
export const PAYMENT_DETAILS = {
  promptPay: '[PromptPay number]',
  bankName: '[Bank name]',
  bankAccount: '[Account number]',
  accountName: '[Account name]',
}
