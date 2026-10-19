import { useState } from 'react'
import { adminApi } from '@/api'
import {
  Button,
  DataTable,
  DetailList,
  Field,
  FilterBar,
  FilterChip,
  LoadState,
  Modal,
  OrderStatusBadge,
  PageHeader,
  PaymentStatusBadge,
  StatusPanel,
  TableCell,
  TableRow,
  TextArea,
} from '@/components/ui'
import { PAYMENT_KIND_LABEL, PAYMENT_STATUS } from '@/constants/status'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import type { Payment, PaymentStatus } from '@/types'
import { formatBaht, formatDateTime } from '@/utils/format'

const FILTERS: (PaymentStatus | 'all')[] = ['pending', 'confirmed', 'rejected', 'all']

/** Check transfer slips by hand: confirm or reject each one. */
export default function PaymentsPage() {
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('pending')
  const { data, status, error, reload } = useApiData(() => adminApi.payments(filter), [filter])
  const [reviewing, setReviewing] = useState<Payment | null>(null)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Deposit, balance and order slips. A slip counts from the time it was sent."
      />
      <FilterBar>
        {FILTERS.map((f) => (
          <FilterChip
            key={f}
            tone={f === 'all' ? undefined : PAYMENT_STATUS[f].tone}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : PAYMENT_STATUS[f].label}
          </FilterChip>
        ))}
      </FilterBar>
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Sent', 'Shop', 'Order', 'Type', 'Amount', 'Method', 'Status', '']}
          isEmpty={(data ?? []).length === 0}
          emptyMessage={filter === 'pending' ? 'No slips waiting.' : 'Nothing here.'}
        >
          {(data ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDateTime(p.submittedAt)}
              </TableCell>
              <TableCell className="font-medium">{p.shopName}</TableCell>
              <TableCell>
                <p className="font-mono text-xs font-semibold text-primary-strong">{p.orderNo}</p>
                <p className="text-xs text-muted-foreground">{p.roundTitle ?? 'Regular order'}</p>
              </TableCell>
              <TableCell className="text-sm">{PAYMENT_KIND_LABEL[p.kind]}</TableCell>
              <TableCell className="font-mono font-semibold">{formatBaht(p.amount)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {p.method}
                {p.reference && <p>Ref {p.reference}</p>}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={p.status} />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={p.status === 'pending' ? 'primary' : 'soft'}
                  onClick={() => setReviewing(p)}
                >
                  {p.status === 'pending' ? 'Review' : 'View'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </LoadState>
      {reviewing && (
        <ReviewModal
          payment={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null)
            void reload()
          }}
        />
      )}
    </div>
  )
}

function ReviewModal({
  payment,
  onClose,
  onDone,
}: {
  payment: Payment
  onClose: () => void
  onDone: () => void
}) {
  const { run } = useToast()
  const { data: detail, status, error, reload } = useApiData(() => adminApi.payment(payment.id), [payment.id])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pending = payment.status === 'pending'

  async function confirm() {
    setBusy(true)
    const ok = await run(
      () => adminApi.confirmPayment(payment.id),
      `Payment from ${payment.shopName} confirmed`,
    )
    setBusy(false)
    if (ok) onDone()
  }

  async function reject() {
    if (!reason.trim()) return setReasonError('Tell the shop what was wrong')
    setBusy(true)
    const ok = await run(
      () => adminApi.rejectPayment(payment.id, reason.trim()),
      'Slip rejected; the shop has been told',
    )
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <Modal
      title={`${PAYMENT_KIND_LABEL[payment.kind]} from ${payment.shopName}`}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        pending && (
          <>
            {rejecting ? (
              <>
                <Button variant="secondary" onClick={() => setRejecting(false)}>
                  Back
                </Button>
                <Button variant="destructive" disabled={busy} onClick={() => void reject()}>
                  Reject slip
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" disabled={busy} onClick={() => setRejecting(true)}>
                  Reject…
                </Button>
                <Button disabled={busy} onClick={() => void confirm()}>
                  Confirm {formatBaht(payment.amount)} received
                </Button>
              </>
            )}
          </>
        )
      }
    >
      <div className="space-y-5">
        <DetailList
          items={[
            ['Amount', <span className="font-mono font-semibold">{formatBaht(payment.amount)}</span>],
            ['Method', `${payment.method}${payment.reference ? ` · ref ${payment.reference}` : ''}`],
            ['Order', <span className="font-mono">{payment.orderNo}</span>],
            ['Order status', <OrderStatusBadge status={payment.orderStatus} />],
            ['Sent', formatDateTime(payment.submittedAt)],
            ['For', payment.roundTitle ?? 'Regular order'],
          ]}
        />
        {payment.status !== 'pending' && (
          <p className="text-sm text-muted-foreground">
            {PAYMENT_STATUS[payment.status].label} {formatDateTime(payment.reviewedAt)} by{' '}
            {payment.reviewedBy}
            {payment.rejectReason && `: ${payment.rejectReason}`}
          </p>
        )}
        <LoadState status={status} error={error} onRetry={reload}>
          {detail?.slipImage ? (
            <a href={detail.slipImage} target="_blank" rel="noreferrer">
              <img
                src={detail.slipImage}
                alt="Transfer slip"
                className="max-h-[50vh] w-full rounded-md border border-border object-contain"
              />
            </a>
          ) : (
            <StatusPanel title="No slip image" />
          )}
        </LoadState>
        {rejecting && (
          <Field label="Reason (sent to the shop)" htmlFor="reject-reason" error={reasonError}>
            <TextArea
              id="reject-reason"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setReasonError(null)
              }}
              placeholder="e.g. The amount on the slip does not match"
            />
          </Field>
        )}
        {pending && payment.kind === 'deposit' && (
          <p className="text-xs text-muted-foreground">
            Rejecting a deposit cancels the order and reopens the offer if its deadline has not passed.
          </p>
        )}
      </div>
    </Modal>
  )
}
