import type {
  AllocationStatus,
  OrderStatus,
  PaymentKind,
  PaymentMethod,
  PaymentStatus,
  RoundStatus,
  UserStatus,
} from '@/types'
import type { Tone } from './tone'

interface StatusStyle {
  label: string
  tone: Tone
}

export const ROUND_STATUS: Record<RoundStatus, StatusStyle & { help: string }> = {
  draft: { label: 'Draft', tone: 'neutral', help: 'Only admins can see it.' },
  open: {
    label: 'Open for requests',
    tone: 'info',
    help: 'Shops can request boxes until the request deadline.',
  },
  allocating: {
    label: 'Allocating',
    tone: 'warning',
    help: 'Requests are closed. Review the offers, then publish.',
  },
  offering: {
    label: 'Offers out',
    tone: 'primary',
    help: 'Shops accept by paying the deposit before the offer deadline.',
  },
  confirmed: {
    label: 'Waiting for stock',
    tone: 'info',
    help: 'Offers are final. Mark the stock as arrived when it comes in.',
  },
  balance_due: {
    label: 'Balance due',
    tone: 'primary',
    help: 'Shops pay the balance; ship orders once paid.',
  },
  closed: { label: 'Closed', tone: 'neutral', help: 'Every order is shipped or cancelled.' },
  cancelled: {
    label: 'Cancelled',
    tone: 'danger',
    help: 'Called off before any offer went out. Shops that requested were told.',
  },
}

export const ROUND_STEPS: RoundStatus[] = [
  'draft',
  'open',
  'allocating',
  'offering',
  'confirmed',
  'balance_due',
  'closed',
]

export const ALLOCATION_STATUS: Record<AllocationStatus, StatusStyle> = {
  draft: { label: 'Not published', tone: 'neutral' },
  not_offered: { label: 'No boxes', tone: 'neutral' },
  offered: { label: 'Waiting for answer', tone: 'primary' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'danger' },
}

export const ORDER_STATUS: Record<OrderStatus, StatusStyle> = {
  awaiting_deposit: { label: 'Deposit checking', tone: 'warning' },
  awaiting_stock: { label: 'Waiting for stock', tone: 'info' },
  pending_payment: { label: 'Payment due', tone: 'primary' },
  paid: { label: 'Paid', tone: 'success' },
  shipped: { label: 'Shipped', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const ORDER_STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[]

export const PAYMENT_STATUS: Record<PaymentStatus, StatusStyle> = {
  pending: { label: 'To check', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const PAYMENT_KIND_LABEL: Record<PaymentKind, string> = {
  deposit: 'Deposit',
  balance: 'Balance',
  full: 'Full payment',
}

export const PAYMENT_METHODS: PaymentMethod[] = ['PromptPay', 'Bank Transfer']

export const USER_STATUS: Record<UserStatus, StatusStyle> = {
  pending: { label: 'Waiting for approval', tone: 'warning' },
  approved: { label: 'Active', tone: 'success' },
  suspended: { label: 'Suspended', tone: 'danger' },
}
