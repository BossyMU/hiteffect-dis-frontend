import {
  ALLOCATION_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ROUND_STATUS,
  USER_STATUS,
} from '@/constants/status'
import { TONE_BADGE, type Tone } from '@/constants/tone'
import type { AllocationStatus, OrderStatus, PaymentStatus, RoundStatus, UserStatus } from '@/types'
import { cn } from '@/utils/cn'

export function Badge({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap uppercase tracking-wider',
        TONE_BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const RoundStatusBadge = ({ status }: { status: RoundStatus }) => (
  <Badge tone={ROUND_STATUS[status].tone}>{ROUND_STATUS[status].label}</Badge>
)

export const AllocationStatusBadge = ({ status }: { status: AllocationStatus }) => (
  <Badge tone={ALLOCATION_STATUS[status].tone}>{ALLOCATION_STATUS[status].label}</Badge>
)

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>
)

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={PAYMENT_STATUS[status].tone}>{PAYMENT_STATUS[status].label}</Badge>
)

export const UserStatusBadge = ({ status }: { status: UserStatus }) => (
  <Badge tone={USER_STATUS[status].tone}>{USER_STATUS[status].label}</Badge>
)
