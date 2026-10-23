import { useCallback, useState } from 'react'
import { shopApi } from '@/api'
import { OnlinePayNote, PayMethodChoice, type PayBy } from '@/components/payments/PayMethodChoice'
import { SlipFields } from '@/components/payments/SlipFields'
import { Field, Modal, ModalActions, TextInput } from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import type { ShopRound, SlipUpload } from '@/types'
import { goToCheckout } from '@/utils/checkout'
import { boxes, formatBaht, formatDeadline } from '@/utils/format'

/** Accept all or part of an offer and pay the deposit: online with Xendit, or by slip. */
export function OfferModal({
  round,
  onClose,
  onDone,
}: {
  round: ShopRound
  onClose: () => void
  onDone: () => void
}) {
  const offer = round.myAllocation!
  const { run } = useToast()
  const [qty, setQty] = useState(String(offer.offeredQty))
  const [slip, setSlip] = useState<SlipUpload | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onSlip = useCallback((s: SlipUpload | null) => setSlip(s), [])
  const online = usePaymentOptions()?.onlinePayment ?? false
  // Online is the default when it's available, until the shop picks.
  const [picked, setPicked] = useState<PayBy | null>(null)
  const payBy = picked ?? (online ? 'online' : 'slip')

  const n = Number(qty)
  const validQty = Number.isInteger(n) && n >= 1 && n <= offer.offeredQty
  // Same rounding as the backend: to the satang.
  const deposit = validQty ? Math.round(n * offer.unitPrice * round.depositPct) / 100 : 0

  async function accept() {
    if (!validQty) return setError(`Enter 1 to ${offer.offeredQty}`)
    if (payBy === 'online') {
      setBusy(true)
      const ok = await run(async () =>
        goToCheckout((await shopApi.acceptOfferOnline(offer.id, n)).checkoutUrl),
      )
      // On success the browser is leaving for Xendit's page; keep the button disabled.
      if (!ok) setBusy(false)
      return
    }
    if (!slip) return setError('Attach the deposit slip')
    setBusy(true)
    const ok = await run(
      () => shopApi.acceptOffer(offer.id, n, slip),
      'Offer accepted. We will confirm your deposit soon.',
    )
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <Modal
      title={`Accept offer: ${round.title}`}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void accept()}
          confirmLabel={payBy === 'online' ? 'Accept and pay online' : 'Accept and send slip'}
          busy={busy}
        />
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          You're offered <b className="text-foreground">{boxes(offer.offeredQty)}</b> at{' '}
          {formatBaht(offer.unitPrice)} each. Accept by {formatDeadline(offer.offerExpiresAt)}. Boxes you
          don't take go back to the pool.
        </p>
        <Field label="Boxes to accept" htmlFor="accept-qty" hint={`Up to ${offer.offeredQty}`}>
          <TextInput
            id="accept-qty"
            type="number"
            min={1}
            max={offer.offeredQty}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value)
              setError(null)
            }}
            className="max-w-32"
          />
        </Field>
        <div className="rounded-lg bg-muted px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span>Total for {validQty ? boxes(n) : '—'}</span>
            <span className="font-mono">{validQty ? formatBaht(n * offer.unitPrice) : '—'}</span>
          </div>
          <div className="mt-1 flex justify-between font-semibold">
            <span>Deposit now ({round.depositPct}%)</span>
            <span className="font-mono text-primary-strong">{validQty ? formatBaht(deposit) : '—'}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">The balance is due when the stock arrives.</p>
        </div>
        {online && <PayMethodChoice value={payBy} onChange={setPicked} />}
        {payBy === 'online' ? (
          <OnlinePayNote amount={deposit} />
        ) : (
          <SlipFields amount={deposit} onChange={onSlip} />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
