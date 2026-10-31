import { useState } from 'react'
import { adminApi } from '@/api'
import { Field, Modal, ModalActions, Select, TextArea, TextInput } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import type { AdminRound, NewRound } from '@/types'
import { addDays, today, toDateInput } from '@/utils/date'

interface RoundFormModalProps {
  /** Edit this round; create a new one when omitted. */
  round?: AdminRound
  onClose: () => void
  onSaved: (round: AdminRound) => void
}

/** Create a round, or edit what its status still allows. */
export function RoundFormModal({ round, onClose, onSaved }: RoundFormModalProps) {
  const { run } = useToast()
  const { data: products } = useApiData(() => adminApi.products())
  const [form, setForm] = useState({
    productId: round?.productId ?? '',
    title: round?.title ?? '',
    totalSupply: String(round?.totalSupply ?? ''),
    depositPct: String(round?.depositPct ?? 30),
    requestDeadline: toDateInput(round?.requestDeadline) || addDays(today(), 7),
    offerWindowDays: String(Math.ceil((round?.offerWindowHours ?? 72) / 24)),
    expectedArrival: round?.expectedArrival ?? '',
    note: round?.note ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const locked = round && round.status !== 'draft'

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  async function save() {
    const e: Record<string, string> = {}
    if (!form.productId) e.productId = 'Pick a product'
    if (!form.title.trim()) e.title = 'Give the round a title'
    const supply = form.totalSupply.trim()
    if (supply && !(Number(supply) > 0 && Number.isInteger(Number(supply))))
      e.totalSupply = 'Whole boxes, more than 0'
    else if (!supply && round?.status === 'allocating')
      e.totalSupply = 'Requests have closed: enter the supply to calculate the offers'
    if (!(Number(form.depositPct) > 0 && Number(form.depositPct) <= 100)) e.depositPct = '1 to 100'
    if (!form.requestDeadline || form.requestDeadline < today()) e.requestDeadline = 'Today or later'
    if (!(Number(form.offerWindowDays) >= 1)) e.offerWindowDays = 'At least 1 day'
    if (Object.keys(e).length) return setErrors(e)

    const body: NewRound = {
      productId: form.productId,
      title: form.title.trim(),
      totalSupply: supply ? Number(supply) : null,
      depositPct: Number(form.depositPct),
      requestDeadline: form.requestDeadline,
      offerWindowHours: Number(form.offerWindowDays) * 24,
      expectedArrival: form.expectedArrival || null,
      note: form.note.trim(),
    }
    setBusy(true)
    let saved: AdminRound | null = null
    const ok = await run(
      async () => {
        if (!round) {
          saved = await adminApi.createRound(body)
          return
        }
        // Send only what the round's status still allows to change.
        const allowed: (keyof NewRound)[] =
          round.status === 'draft'
            ? (Object.keys(body) as (keyof NewRound)[])
            : round.status === 'open'
              ? ['title', 'totalSupply', 'requestDeadline', 'offerWindowHours', 'expectedArrival', 'note']
              : round.status === 'allocating'
                ? ['title', 'totalSupply', 'offerWindowHours', 'expectedArrival', 'note']
                : ['title', 'expectedArrival', 'note']
        saved = await adminApi.updateRound(round.id, Object.fromEntries(allowed.map((k) => [k, body[k]])))
      },
      round ? 'Round saved' : 'Round created as a draft',
    )
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  const disabled = (field: string) => {
    if (!round || round.status === 'draft') return false
    if (round.status === 'open') return ['productId', 'depositPct'].includes(field)
    if (round.status === 'allocating') return ['productId', 'depositPct', 'requestDeadline'].includes(field)
    return !['title', 'expectedArrival', 'note'].includes(field)
  }

  return (
    <Modal
      title={round ? 'Edit round' : 'New pre-order round'}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel={round ? 'Save' : 'Create draft'}
          busy={busy}
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product" htmlFor="r-product" error={errors.productId} className="sm:col-span-2">
          <Select
            id="r-product"
            value={form.productId}
            disabled={disabled('productId')}
            onChange={(e) => set('productId')(e.target.value)}
          >
            <option value="">Choose a product…</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title shops see" htmlFor="r-title" error={errors.title} className="sm:col-span-2">
          <TextInput
            id="r-title"
            value={form.title}
            onChange={(e) => set('title')(e.target.value)}
            placeholder="e.g. OP-10 Booster Box"
          />
        </Field>
        <Field
          label="Supply (boxes)"
          htmlFor="r-supply"
          error={errors.totalSupply}
          hint="What the publisher will send us. Leave empty until they confirm."
        >
          <TextInput
            id="r-supply"
            type="number"
            min={1}
            disabled={disabled('totalSupply')}
            placeholder="Not known yet"
            value={form.totalSupply}
            onChange={(e) => set('totalSupply')(e.target.value)}
          />
        </Field>
        <Field label="Deposit %" htmlFor="r-deposit" error={errors.depositPct}>
          <TextInput
            id="r-deposit"
            type="number"
            min={1}
            max={100}
            disabled={disabled('depositPct')}
            value={form.depositPct}
            onChange={(e) => set('depositPct')(e.target.value)}
          />
        </Field>
        <Field
          label="Request deadline"
          htmlFor="r-deadline"
          error={errors.requestDeadline}
          hint="Closes at 23:59 Bangkok time"
        >
          <TextInput
            id="r-deadline"
            type="date"
            disabled={disabled('requestDeadline')}
            value={form.requestDeadline}
            onChange={(e) => set('requestDeadline')(e.target.value)}
          />
        </Field>
        <Field
          label="Offer window (days)"
          htmlFor="r-window"
          error={errors.offerWindowDays}
          hint="Time shops get to accept"
        >
          <TextInput
            id="r-window"
            type="number"
            min={1}
            disabled={disabled('offerWindowHours')}
            value={form.offerWindowDays}
            onChange={(e) => set('offerWindowDays')(e.target.value)}
          />
        </Field>
        <Field
          label="Expected arrival (estimate)"
          htmlFor="r-arrival"
          hint="Shown to shops; change it any time"
        >
          <TextInput
            id="r-arrival"
            type="date"
            value={form.expectedArrival}
            onChange={(e) => set('expectedArrival')(e.target.value)}
          />
        </Field>
        <Field label="Note for shops" htmlFor="r-note" className="sm:col-span-2">
          <TextArea id="r-note" value={form.note} onChange={(e) => set('note')(e.target.value)} />
        </Field>
      </div>
      {locked && (
        <p className="mt-4 text-xs text-muted-foreground">Some fields can no longer change at this stage.</p>
      )}
    </Modal>
  )
}
