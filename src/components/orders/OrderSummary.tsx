import type { ReactNode } from 'react'
import { Badge, DataTable, OrderStatusBadge, PaymentStatusBadge, TableCell, TableRow } from '@/components/ui'
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL } from '@/constants/status'
import type { Order, OrderPayment } from '@/types'
import { cn } from '@/utils/cn'
import { formatBaht, formatDateTime, formatDeadline } from '@/utils/format'
import { deliveryLabel, shippingSummary } from '@/utils/shipping'
import { ShippingBreakdown } from './ShippingBreakdown'

/** Tighter cells on phones, so the Amount column stays on screen. */
const cell = 'px-3 sm:px-4'
/** Columns shown from the sm breakpoint up; on phones their values go under the product name. */
const wide = 'hidden sm:table-cell'

/** Status and order type, as badges. */
export function OrderBadges({ order }: { order: Order }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <OrderStatusBadge status={order.status} pickup={order.deliveryMethod === 'pickup'} />
      <Badge tone="neutral">{order.type === 'preorder' ? 'Pre-order' : 'Regular'}</Badge>
      {order.deliveryMethod === 'pickup' && <Badge tone="info">{deliveryLabel('pickup')}</Badge>}
    </span>
  )
}

/**
 * The order's items, with the money below them in the same table: every amount sits in the
 * Amount column, right-aligned, so the totals line up with the lines they add up.
 * Goods + shipping = total; a pre-order's deposit is on the goods, and its shipping comes with the balance.
 */
export function OrderItemsTable({ order }: { order: Order }) {
  const shipping = order.shippingDetail
  const pickup = order.deliveryMethod === 'pickup'
  // A pre-order is charged shipping when its stock arrives, once the final number of boxes is known.
  const shippingLater = !pickup && !shipping && order.type === 'preorder' && order.status !== 'cancelled'
  return (
    <div className="space-y-2">
      <DataTable
        headers={[
          { label: 'Product', className: cell },
          { label: 'Boxes', align: 'right', className: cn(cell, wide) },
          { label: 'Price', align: 'right', className: cn(cell, wide) },
          { label: 'Amount', align: 'right', className: cell },
        ]}
        footer={
          <>
            <TotalRow label="Subtotal (incl. VAT)" value={order.subtotal} />
            {shipping && (
              <>
                <TotalRow label="Shipping" value={order.shippingFee} note={shippingSummary(shipping)} />
                <TotalRow label="Total" value={order.total} />
              </>
            )}
            {pickup && (
              <>
                <TotalRow label="Pick-up at warehouse" value={0} note="no shipping" muted />
                <TotalRow label="Total" value={order.total} />
              </>
            )}
            {shippingLater && (
              <TotalRow
                label="Shipping"
                value={null}
                note="added with the balance when the stock arrives"
                muted
              />
            )}
            {order.type === 'preorder' && order.depositAmount > 0 && (
              <TotalRow label="Deposit" value={order.depositAmount} muted />
            )}
            <TotalRow label="Paid so far" value={order.paidAmount} muted />
            {order.status === 'pending_payment' && (
              <TotalRow
                label="To pay"
                value={order.amountDue}
                note={`by ${formatDeadline(order.paymentDueAt)}`}
                strong
              />
            )}
            {order.refundDue > 0 && <TotalRow label="Refund due to you" value={order.refundDue} strong />}
          </>
        }
      >
        {order.items.map((i) => (
          <TableRow key={i.productId}>
            <TableCell className={cell}>
              <p className="font-medium">{i.productName}</p>
              <p className="font-mono text-xs text-muted-foreground">{i.sku}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground sm:hidden">
                {i.qty} × {formatBaht(i.unitPrice)}
              </p>
            </TableCell>
            <TableCell className={cn(cell, wide, 'text-right font-mono')}>{i.qty}</TableCell>
            <TableCell className={cn(cell, wide, 'text-right font-mono whitespace-nowrap')}>
              {formatBaht(i.unitPrice)}
            </TableCell>
            <TableCell className={cn(cell, 'text-right font-mono font-semibold whitespace-nowrap')}>
              {formatBaht(i.qty * i.unitPrice)}
            </TableCell>
          </TableRow>
        ))}
      </DataTable>
      {shipping && <ShippingBreakdown quote={shipping} className="px-1" />}
    </div>
  )
}

function TotalRow({
  label,
  value,
  note,
  muted,
  strong,
}: {
  label: string
  /** Null: shown as a dash (not known yet). */
  value: number | null
  note?: ReactNode
  muted?: boolean
  strong?: boolean
}) {
  const text = (
    <>
      <span className={cn(strong ? 'font-semibold' : muted ? 'text-muted-foreground' : 'font-medium')}>
        {label}
      </span>
      {note && <span className="ml-2 inline-block text-xs text-muted-foreground">{note}</span>}
    </>
  )
  const labelCell = 'py-2 text-right text-sm'
  return (
    <tr className={cn(strong && 'bg-primary/5')}>
      {/* The label spans the columns before Amount: 3 from sm up, 1 on phones (2 are hidden). */}
      <td colSpan={3} className={cn(cell, labelCell, wide)}>
        {text}
      </td>
      <td className={cn(cell, labelCell, 'sm:hidden')}>{text}</td>
      <td
        className={cn(
          cell,
          'py-2 text-right font-mono whitespace-nowrap',
          strong ? 'font-semibold text-primary-strong' : muted ? 'text-muted-foreground' : 'font-semibold',
        )}
      >
        {value == null ? '—' : formatBaht(value)}
      </td>
    </tr>
  )
}

/** Slips sent for the order: what it was for, how and when it was sent, status, amount. */
export function OrderPaymentsTable({ payments }: { payments: OrderPayment[] }) {
  return (
    <DataTable
      headers={[
        { label: 'Payment', className: cell },
        { label: 'Status', className: cell },
        { label: 'Amount', align: 'right', className: cell },
      ]}
    >
      {payments.map((p) => (
        <TableRow key={p.id}>
          <TableCell className={cell}>
            <p className="font-medium">{PAYMENT_KIND_LABEL[p.kind]}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {PAYMENT_METHOD_LABEL[p.method]} · {formatDateTime(p.submittedAt)}
              {p.reference && ` · ${p.reference}`}
            </p>
          </TableCell>
          <TableCell className={cell}>
            <PaymentStatusBadge status={p.status} online={p.method === 'Xendit'} />
            {p.rejectReason && (
              <p
                className={cn(
                  'mt-1 text-xs',
                  p.method === 'Xendit' ? 'text-muted-foreground' : 'text-danger',
                )}
              >
                {p.rejectReason}
              </p>
            )}
          </TableCell>
          <TableCell className={cn(cell, 'text-right font-mono whitespace-nowrap')}>
            {formatBaht(p.amount)}
          </TableCell>
        </TableRow>
      ))}
    </DataTable>
  )
}

/** Items, money and payments of one order in a single column, for the admin's order window. */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary-strong">{order.orderNo}</span>
        <OrderBadges order={order} />
        {order.roundTitle && <span className="text-sm text-muted-foreground">{order.roundTitle}</span>}
      </div>
      <OrderItemsTable order={order} />
      {order.cancelReason && (
        <p className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {order.cancelReason}
        </p>
      )}
      {order.trackingNo && (
        <p className="text-sm">
          Tracking number: <span className="font-mono font-semibold">{order.trackingNo}</span>
        </p>
      )}
      {order.payments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Payments</h3>
          <OrderPaymentsTable payments={order.payments} />
        </div>
      )}
    </div>
  )
}
