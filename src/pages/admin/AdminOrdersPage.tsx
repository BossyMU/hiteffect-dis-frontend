import { useMemo, useState } from 'react'
import { adminApi } from '@/api'
import { Link } from 'react-router'
import { OrderSummary, PickupPlace, TrackingTimeline } from '@/components/orders'
import {
  Button,
  DataTable,
  Field,
  FilterBar,
  FilterChip,
  LoadState,
  Modal,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  TableCell,
  TableRow,
  TextArea,
  TextInput,
} from '@/components/ui'
import { ORDER_STATUS, ORDER_STATUSES } from '@/constants/status'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { usePagination } from '@/hooks/usePagination'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import { PATHS } from '@/routes/paths'
import type { Order, OrderStatus } from '@/types'
import { boxes, formatBaht, formatDate, formatDeadline } from '@/utils/format'
import { isValidTrackingNo, normalizeTrackingNo } from '@/utils/trackingNo'

export default function AdminOrdersPage() {
  const { data, status, error, reload } = useApiData(() => adminApi.orders())
  const [filter, setFilter] = useState<OrderStatus | 'all'>('paid')
  const [type, setType] = useState<'all' | 'preorder' | 'regular'>('all')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<Order | null>(null)
  const orders = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (filter === 'all' || o.status === filter) &&
        (type === 'all' || o.type === type) &&
        (!q || o.orderNo.toLowerCase().includes(q) || o.shopName.toLowerCase().includes(q)),
    )
  }, [orders, filter, type, search])
  const { page, setPage, paged, pageSize, total } = usePagination(filtered)

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle="Ship or hand over paid orders; cancel when needed" />
      <FilterBar>
        <FilterChip
          active={filter === 'all'}
          onClick={() => {
            setFilter('all')
            setPage(1)
          }}
        >
          All <span className="ml-1 opacity-60">{orders.length}</span>
        </FilterChip>
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s}
            tone={ORDER_STATUS[s].tone}
            active={filter === s}
            onClick={() => {
              setFilter(s)
              setPage(1)
            }}
          >
            {ORDER_STATUS[s].label}{' '}
            <span className="ml-1 opacity-60">{orders.filter((o) => o.status === s).length}</span>
          </FilterChip>
        ))}
      </FilterBar>
      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search order number or shop…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Select
          aria-label="Order type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-44"
        >
          <option value="all">All types</option>
          <option value="preorder">Pre-orders</option>
          <option value="regular">Regular</option>
        </Select>
      </div>
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Order', 'Shop', 'What', 'Total', 'Paid', 'Status', 'Due / ship']}
          isEmpty={filtered.length === 0}
          emptyMessage="No orders match."
        >
          {paged.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => setViewing(o)}>
              <TableCell>
                <p className="font-mono text-xs font-semibold text-primary-strong">{o.orderNo}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</p>
              </TableCell>
              <TableCell className="font-medium">{o.shopName}</TableCell>
              <TableCell className="text-sm">
                {o.roundTitle ?? o.items.map((i) => i.productName).join(', ')}
                <p className="text-xs text-muted-foreground">
                  {boxes(o.items.reduce((s, i) => s + i.qty, 0))}
                  {o.deliveryMethod === 'pickup' && (
                    <span className="font-semibold text-info"> · Pick-up</span>
                  )}
                </p>
              </TableCell>
              <TableCell className="font-mono font-semibold">{formatBaht(o.total)}</TableCell>
              <TableCell className="font-mono text-xs">{formatBaht(o.paidAmount)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} pickup={o.deliveryMethod === 'pickup'} />
                {o.refundDue > 0 && (
                  <p className="mt-1 text-xs text-danger">Refund {formatBaht(o.refundDue)}</p>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {o.status === 'pending_payment'
                  ? formatDeadline(o.paymentDueAt)
                  : o.status === 'paid'
                    ? o.deliveryMethod === 'pickup'
                      ? 'Ready to pick up'
                      : formatDate(o.shipDate)
                    : '—'}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
        <Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
      </LoadState>
      {viewing && (
        <OrderModal
          order={viewing}
          onClose={() => setViewing(null)}
          onChanged={(o) => {
            setViewing(o)
            void reload()
          }}
        />
      )}
    </div>
  )
}

function OrderModal({
  order,
  onClose,
  onChanged,
}: {
  order: Order
  onClose: () => void
  onChanged: (o: Order) => void
}) {
  const { run } = useToast()
  const options = usePaymentOptions()
  const pickup = order.deliveryMethod === 'pickup'
  const [mode, setMode] = useState<'view' | 'ship' | 'cancel'>('view')
  const [tracking, setTracking] = useState(order.trackingNo ?? '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canCancel = !['shipped', 'cancelled'].includes(order.status)

  async function submit() {
    if (mode === 'cancel' && !reason.trim()) return setError('Give a reason; the shop sees it')
    if (mode === 'ship' && !pickup && tracking.trim() && !isValidTrackingNo(tracking)) {
      return setError('This is not a valid Thailand Post number. Check it against the post office receipt.')
    }
    setBusy(true)
    let saved: Order | null = null
    const ok = await run(
      async () => {
        saved =
          mode === 'ship'
            ? await adminApi.shipOrder(order.id, pickup ? '' : normalizeTrackingNo(tracking))
            : await adminApi.cancelOrder(order.id, reason.trim())
      },
      mode === 'ship' ? (pickup ? 'Marked as picked up' : 'Marked as shipped') : 'Order cancelled',
    )
    setBusy(false)
    if (ok && saved) {
      setMode('view')
      onChanged(saved)
    }
  }

  return (
    <Modal
      title={`${order.orderNo} · ${order.shopName}`}
      onClose={onClose}
      className="max-w-3xl"
      footer={
        mode === 'view' ? (
          <>
            {canCancel && (
              <Button variant="secondary" onClick={() => setMode('cancel')}>
                Cancel order…
              </Button>
            )}
            {order.status === 'paid' && !pickup && (
              <Link
                to={PATHS.adminOrderLabel(order.id)}
                target="_blank"
                className="self-center px-2 text-sm font-semibold text-info hover:underline"
              >
                Print label
              </Link>
            )}
            {order.status === 'paid' && (
              <Button onClick={() => setMode('ship')}>{pickup ? 'Mark picked up…' : 'Mark shipped…'}</Button>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setMode('view')}>
              Back
            </Button>
            <Button
              variant={mode === 'cancel' ? 'destructive' : 'primary'}
              disabled={busy}
              onClick={() => void submit()}
            >
              {mode === 'ship' ? (pickup ? 'Picked up' : 'Shipped') : 'Cancel order'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <OrderSummary order={order} />
        {pickup ? (
          <p className="text-sm text-muted-foreground">
            Pick-up at <PickupPlace />
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Ship to: {order.shipAddress || '—'}</p>
        )}
        {order.note && <p className="text-sm">Note: {order.note}</p>}
        {!pickup && order.status === 'shipped' && order.trackingNo && options?.thaipost.tracking && (
          <TrackingTimeline load={() => adminApi.tracking(order.id)} />
        )}
        {mode === 'ship' && pickup && (
          <p className="rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm">
            Check the shop's order number before handing over the boxes. They are taken out of stock and the
            shop is told the order was picked up.
          </p>
        )}
        {mode === 'ship' && !pickup && (
          <Field
            label="Thailand Post tracking number"
            htmlFor="tracking"
            error={error}
            hint="From the post office receipt, e.g. EB123456785TH. Typos are caught by the check digit."
          >
            <div className="flex gap-2">
              <TextInput
                id="tracking"
                value={tracking}
                onChange={(e) => {
                  setTracking(e.target.value)
                  setError(null)
                }}
                className="font-mono uppercase"
                placeholder="EB123456785TH"
              />
              {options?.thaipost.autoTrackingNo && !tracking && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const o = await adminApi.assignTrackingNo(order.id)
                      setTracking(o.trackingNo)
                      onChanged(o)
                    }, 'Tracking number assigned')
                  }
                >
                  Get number
                </Button>
              )}
            </div>
            {tracking && isValidTrackingNo(tracking) && (
              <p className="mt-1 text-xs text-success">✓ Valid number</p>
            )}
          </Field>
        )}
        {mode === 'cancel' && (
          <Field
            label="Reason (sent to the shop)"
            htmlFor="cancel-reason"
            error={error}
            hint="Held boxes go back to stock. Deposits are not refunded automatically."
          >
            <TextArea
              id="cancel-reason"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
          </Field>
        )}
      </div>
    </Modal>
  )
}
