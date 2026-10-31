import type { OrderStatus } from '@/types'

/**
 * What is left to pay after the deposit: goods + shipping − what we have received. While the
 * deposit slip is being checked it already counts, so the balance never shows the full price.
 */
export function balanceLeft(o: {
  status: OrderStatus
  subtotal: number
  shippingFee: number
  depositAmount: number
  paidAmount: number
}) {
  const paid = o.status === 'awaiting_deposit' ? Math.max(o.paidAmount, o.depositAmount) : o.paidAmount
  return Math.max(0, Math.round((o.subtotal + o.shippingFee - paid) * 100) / 100)
}
