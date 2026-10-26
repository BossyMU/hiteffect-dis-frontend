import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { shopApi } from '@/api'
import {
  DataTable,
  FilterBar,
  FilterChip,
  LoadState,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  TableCell,
  TableRow,
} from '@/components/ui'
import type { Tone } from '@/constants/tone'
import { useApiData } from '@/hooks/useApiData'
import { usePagination } from '@/hooks/usePagination'
import { PATHS } from '@/routes/paths'
import type { Order } from '@/types'
import { boxes, formatBaht, formatDate, formatDeadline } from '@/utils/format'

type Filter = 'all' | 'to_pay' | 'in_progress' | 'shipped' | 'cancelled'

const FILTERS: { key: Filter; label: string; tone?: Tone; match: (o: Order) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'to_pay', label: 'To pay', tone: 'primary', match: (o) => o.status === 'pending_payment' },
  {
    key: 'in_progress',
    label: 'In progress',
    tone: 'info',
    match: (o) => ['awaiting_deposit', 'awaiting_stock', 'paid'].includes(o.status),
  },
  { key: 'shipped', label: 'Shipped', tone: 'neutral', match: (o) => o.status === 'shipped' },
  { key: 'cancelled', label: 'Cancelled', tone: 'danger', match: (o) => o.status === 'cancelled' },
]

export default function ShopOrdersPage() {
  const navigate = useNavigate()
  const { data, status, error, reload } = useApiData(() => shopApi.orders())
  const [filter, setFilter] = useState<Filter>('all')
  const orders = useMemo(() => data ?? [], [data])
  const filtered = useMemo(
    () => orders.filter(FILTERS.find((f) => f.key === filter)!.match),
    [orders, filter],
  )
  const { page, setPage, paged, pageSize, total } = usePagination(filtered)

  return (
    <div className="space-y-5">
      <PageHeader title="My orders" subtitle="Pre-order and regular orders" />
      <FilterBar>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            tone={f.tone}
            active={filter === f.key}
            onClick={() => {
              setFilter(f.key)
              setPage(1)
            }}
          >
            {f.label} <span className="ml-1 opacity-60">{orders.filter(f.match).length}</span>
          </FilterChip>
        ))}
      </FilterBar>
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Order', 'Date', 'What', 'Total', 'Status', 'Next step']}
          isEmpty={filtered.length === 0}
          emptyMessage="No orders here."
        >
          {paged.map((o) => (
            <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(PATHS.order(o.id))}>
              <TableCell className="font-mono text-xs font-semibold text-primary-strong">
                {o.orderNo}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDate(o.createdAt)}
              </TableCell>
              <TableCell className="text-sm">
                {o.roundTitle ?? o.items.map((i) => i.productName).join(', ')}
                <p className="text-xs text-muted-foreground">
                  {boxes(o.items.reduce((s, i) => s + i.qty, 0))} ·{' '}
                  {o.type === 'preorder' ? 'Pre-order' : 'Regular'}
                </p>
              </TableCell>
              <TableCell className="font-mono font-semibold">{formatBaht(o.total)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{nextStep(o)}</TableCell>
            </TableRow>
          ))}
        </DataTable>
        <Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
      </LoadState>
    </div>
  )
}

function nextStep(o: Order) {
  const slipPending = o.payments.some((p) => p.status === 'pending')
  switch (o.status) {
    case 'awaiting_deposit':
      return slipPending ? 'We are checking your deposit' : 'Waiting for your deposit'
    case 'awaiting_stock':
      return '✓ Deposit confirmed · waiting for the stock'
    case 'pending_payment':
      return slipPending
        ? 'We are checking your payment'
        : `Pay ${formatBaht(o.amountDue)} by ${formatDeadline(o.paymentDueAt)}`
    case 'paid':
      return `✓ Payment confirmed · ${o.shipDate ? `ships around ${formatDate(o.shipDate)}` : 'being packed'}`
    case 'shipped':
      return o.trackingNo ? `Tracking ${o.trackingNo}` : `Shipped ${formatDate(o.shippedAt)}`
    default:
      return '—'
  }
}
