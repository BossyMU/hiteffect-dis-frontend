import type { Order, OrderStatus } from '@/types'
import { formatBaht } from '@/utils/format'

/**
 * The shop's pay button for an order. It is only active when a payment is due now. While a
 * payment is being checked, and after we confirm it until the next payment is due, it stays on
 * screen, disabled, saying where things are.
 */
export interface PayStatus {
  label: string
  /** A payment is due now: the button opens the payment window. */
  enabled: boolean
  /** We confirmed the last payment: shown with a tick. */
  confirmed: boolean
}

export function payStatus(o: {
  status: OrderStatus
  amountDue: number
  paymentPending: boolean
}): PayStatus | null {
  if (o.status === 'cancelled') return null
  if (o.paymentPending) {
    return {
      label: o.status === 'awaiting_deposit' ? 'Checking your deposit' : 'Checking your payment',
      enabled: false,
      confirmed: false,
    }
  }
  switch (o.status) {
    case 'pending_payment':
      return { label: `Pay ${formatBaht(o.amountDue)}`, enabled: true, confirmed: false }
    case 'awaiting_stock':
      return { label: 'Deposit confirmed', enabled: false, confirmed: true }
    case 'paid':
    case 'shipped':
      return { label: 'Payment confirmed', enabled: false, confirmed: true }
    default:
      return null
  }
}

/** `payStatus` for a full order, which lists its payments. */
export const orderPayStatus = (o: Order) =>
  payStatus({ ...o, paymentPending: o.payments.some((p) => p.status === 'pending') })

/** The latest payment we confirmed on an order, for "We confirmed … on …". */
export const lastConfirmedPayment = (o: Order) =>
  o.payments
    .filter((p) => p.status === 'confirmed')
    .sort((a, b) => (a.reviewedAt ?? '').localeCompare(b.reviewedAt ?? ''))
    .at(-1)
