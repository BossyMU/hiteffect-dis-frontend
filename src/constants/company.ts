import { APP_ENV } from '@/config/env'

/**
 * Where shops send money. Shown with every slip payment: a PromptPay QR code with the amount
 * filled in, and the bank account.
 *
 * promptPay: the mobile number (e.g. 0812345678) or 13-digit tax ID the PromptPay account is
 * registered to.
 *
 * Production shows the real account. UAT and local copies show test details, so nobody testing
 * there sends real money: the test PromptPay ID can't belong to anyone (its last digit fails the
 * Thai ID check, so banking apps refuse it), and `testOnly` adds a "don't send money" notice.
 */
const REAL_PAYMENT_DETAILS = {
  testOnly: false,
  promptPay: '0887688172',
  bankName: 'Kasikornbank (KBank)',
  bankAccount: '178-3-23225-8',
  accountName: 'นาย นนทนาถ จันทวงศ์',
}

const TEST_PAYMENT_DETAILS = {
  testOnly: true,
  promptPay: '0000000000000',
  bankName: 'Test Bank',
  bankAccount: '000-0-00000-0',
  accountName: 'HIT EFFECT (TEST)',
}

export const PAYMENT_DETAILS = APP_ENV === 'production' ? REAL_PAYMENT_DETAILS : TEST_PAYMENT_DETAILS
