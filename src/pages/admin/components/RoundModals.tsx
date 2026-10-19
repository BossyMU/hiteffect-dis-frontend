import { useState } from 'react'
import { adminApi } from '@/api'
import { Field, Modal, ModalActions, TextArea, TextInput } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import type { RoundAllocation, RoundDetail } from '@/types'
import { addDays, today, toDateInput } from '@/utils/date'
import { boxes } from '@/utils/format'

interface ModalProps {
  round: RoundDetail
  onClose: () => void
  onSaved: (round: RoundDetail) => void
}

/** Change one shop's offer. Logged with the reason. */
export function AdjustModal({
  round,
  allocation,
  onClose,
  onSaved,
}: ModalProps & { allocation: RoundAllocation }) {
  const { run } = useToast()
  const [qty, setQty] = useState(String(allocation.offeredQty))
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const othersTotal = round.allocations
    .filter((a) => a.id !== allocation.id && ['draft', 'offered', 'accepted'].includes(a.status))
    .reduce((s, a) => s + (a.acceptedQty ?? a.offeredQty), 0)
  const free = round.totalSupply - othersTotal

  async function save() {
    const n = Number(qty)
    if (!Number.isInteger(n) || n < 0) return setError('Enter whole boxes (0 or more)')
    if (n > free) return setError(`Only ${free} boxes are free`)
    if (!reason.trim()) return setError('Give a reason; it goes in the audit log')
    setBusy(true)
    let saved: RoundDetail | null = null
    const ok = await run(async () => {
      saved = await adminApi.adjustAllocation(allocation.id, n, reason.trim())
    }, 'Offer changed')
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title={`Change offer: ${allocation.shopName}`}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel="Save change"
          busy={busy}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Requested {boxes(allocation.requestedQty)}, calculated {boxes(allocation.offeredQty)}. Up to{' '}
          {boxes(free)} can be offered without going over the supply.
          {round.status === 'offering' && ' The shop is notified of the change.'}
        </p>
        <Field label="Boxes to offer" htmlFor="adj-qty">
          <TextInput
            id="adj-qty"
            type="number"
            min={0}
            max={free}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value)
              setError(null)
            }}
            className="w-32"
          />
        </Field>
        <Field label="Reason" htmlFor="adj-reason" error={error}>
          <TextArea
            id="adj-reason"
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError(null)
            }}
            placeholder="e.g. Moved 2 boxes from a shop that asked to reduce"
          />
        </Field>
      </div>
    </Modal>
  )
}

/** Stock arrived: how many boxes came, and when shops must pay and when we ship. */
export function ArriveModal({ round, onClose, onSaved }: ModalProps) {
  const { run } = useToast()
  const [received, setReceived] = useState(String(round.totalSupply))
  const [paymentDeadline, setPaymentDeadline] = useState(addDays(today(), 5))
  const [shipDate, setShipDate] = useState(addDays(today(), 7))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const accepted = round.stats.acceptedTotal
  const n = Number(received)

  async function save() {
    if (!Number.isInteger(n) || n < 0) return setError('Enter the number of boxes that arrived')
    if (paymentDeadline < today()) return setError('The payment deadline is in the past')
    if (shipDate < paymentDeadline) return setError('Ship on or after the payment deadline')
    if (
      n < accepted &&
      !window.confirm(
        `Only ${n} boxes for ${accepted} accepted. Accepted orders will be cut fairly and the extra deposit marked for refund. Continue?`,
      )
    )
      return
    setBusy(true)
    let saved: RoundDetail | null = null
    const ok = await run(async () => {
      saved = await adminApi.arrive(round.id, {
        receivedQty: n,
        paymentDeadline,
        shipDate,
        note: note.trim(),
      })
    }, 'Stock received. Shops have been asked for the balance.')
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title="Mark stock as arrived"
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel="Stock arrived"
          busy={busy}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Shops accepted {boxes(accepted)}. Their boxes are held for them; anything left over becomes regular
          stock.
        </p>
        <Field
          label="Boxes that arrived"
          htmlFor="arr-qty"
          hint={n < accepted ? `Fewer than accepted: orders will be cut fairly` : undefined}
        >
          <TextInput
            id="arr-qty"
            type="number"
            min={0}
            value={received}
            onChange={(e) => {
              setReceived(e.target.value)
              setError(null)
            }}
            className="w-32"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment deadline" htmlFor="arr-pay" hint="23:59 Bangkok time">
            <TextInput
              id="arr-pay"
              type="date"
              value={paymentDeadline}
              onChange={(e) => {
                setPaymentDeadline(e.target.value)
                setError(null)
              }}
            />
          </Field>
          <Field label="Ship date" htmlFor="arr-ship">
            <TextInput
              id="arr-ship"
              type="date"
              value={shipDate}
              onChange={(e) => {
                setShipDate(e.target.value)
                setError(null)
              }}
            />
          </Field>
        </div>
        <Field label="Note (optional)" htmlFor="arr-note" error={error}>
          <TextArea id="arr-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

/** Delays and date changes. Every shop with an order in the round is notified. */
export function ScheduleModal({ round, onClose, onSaved }: ModalProps) {
  const { run } = useToast()
  const afterArrival = round.status === 'balance_due'
  const [expectedArrival, setExpectedArrival] = useState(round.expectedArrival ?? '')
  const [paymentDeadline, setPaymentDeadline] = useState(toDateInput(round.paymentDeadline))
  const [shipDate, setShipDate] = useState(round.shipDate ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    const body = afterArrival
      ? { paymentDeadline, shipDate, note: note.trim() }
      : { expectedArrival: expectedArrival || null, note: note.trim() }
    setBusy(true)
    let saved: RoundDetail | null = null
    const ok = await run(async () => {
      saved = await adminApi.schedule(round.id, body)
    }, 'Dates changed; shops have been told')
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title="Change dates"
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel="Save and notify shops"
          busy={busy}
        />
      }
    >
      <div className="space-y-4">
        {afterArrival ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment deadline" htmlFor="sch-pay" hint="Moves every unpaid order's deadline">
              <TextInput
                id="sch-pay"
                type="date"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
              />
            </Field>
            <Field label="Ship date" htmlFor="sch-ship">
              <TextInput
                id="sch-ship"
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
              />
            </Field>
          </div>
        ) : (
          <Field label="Expected arrival" htmlFor="sch-arr" hint="Leave empty for 'to be announced'">
            <TextInput
              id="sch-arr"
              type="date"
              value={expectedArrival}
              onChange={(e) => setExpectedArrival(e.target.value)}
            />
          </Field>
        )}
        <Field label="Message to shops (optional)" htmlFor="sch-note">
          <TextArea
            id="sch-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. The shipment from the publisher is delayed by a week."
          />
        </Field>
      </div>
    </Modal>
  )
}
