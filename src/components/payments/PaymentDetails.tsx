import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'
import { PAYMENT_DETAILS } from '@/constants/company'
import { formatBaht } from '@/utils/format'
import { promptPayPayload } from '@/utils/promptpay'

/** Values in company.ts that are still placeholders look like "[Bank name]". */
const isSet = (value: string) => value.trim() !== '' && !value.trim().startsWith('[')

/**
 * Where to send money for a slip payment: a PromptPay QR code with the amount already in it,
 * and the bank account, with copy buttons.
 */
export function PaymentDetails({ amount }: { amount: number }) {
  const qr =
    amount > 0 && isSet(PAYMENT_DETAILS.promptPay)
      ? promptPayPayload(PAYMENT_DETAILS.promptPay, amount)
      : null
  const bankSet = isSet(PAYMENT_DETAILS.bankAccount)
  const canvas = useRef<HTMLCanvasElement>(null)

  /** Save the QR as an image, for shops paying from the same phone (open it in the banking app). */
  function saveQr() {
    const url = canvas.current?.toDataURL('image/png')
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `hiteffect-promptpay-${amount.toFixed(2)}.png`
    link.click()
  }

  return (
    <div className="space-y-3">
      {PAYMENT_DETAILS.testOnly && (
        <p
          role="note"
          className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning"
        >
          Test details, not a real account. Don't send money; for testing, attach any image as the slip.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4 text-center text-sm">
          <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            PromptPay QR
          </h3>
          {qr ? (
            <>
              <div className="mx-auto mt-3 w-fit rounded-md bg-white p-1.5">
                <QRCodeCanvas
                  ref={canvas}
                  value={qr}
                  size={168}
                  marginSize={2}
                  level="M"
                  title={`PromptPay QR for ${formatBaht(amount)}`}
                />
              </div>
              <p className="mt-2 font-mono text-lg font-semibold">{formatBaht(amount)}</p>
              {isSet(PAYMENT_DETAILS.accountName) && (
                <p className="text-xs text-muted-foreground">{PAYMENT_DETAILS.accountName}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Scan with any Thai banking app; the amount is filled in.
              </p>
              <button
                type="button"
                onClick={saveQr}
                className="mt-1 text-xs font-semibold text-info hover:underline"
              >
                Save QR image
              </button>
            </>
          ) : (
            <p className="mt-3 text-muted-foreground">
              {amount > 0 ? 'PromptPay is not set up yet.' : 'The QR code appears once the amount is known.'}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4 text-sm">
          <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            Bank transfer
          </h3>
          {bankSet ? (
            <dl className="mt-3 space-y-2.5">
              <Detail label="Bank" value={PAYMENT_DETAILS.bankName} />
              <Detail
                label="Account number"
                value={PAYMENT_DETAILS.bankAccount}
                copy={PAYMENT_DETAILS.bankAccount.replace(/\D/g, '')}
                mono
              />
              <Detail label="Account name" value={PAYMENT_DETAILS.accountName} />
              {amount > 0 && (
                <Detail label="Amount" value={formatBaht(amount)} copy={amount.toFixed(2)} mono />
              )}
            </dl>
          ) : (
            <p className="mt-3 text-muted-foreground">Bank details are not set up yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  copy,
  mono,
}: {
  label: string
  value: string
  copy?: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center justify-between gap-2">
        <span className={mono ? 'font-mono font-semibold' : 'font-medium'}>{value}</span>
        {copy && <CopyButton text={copy} label={label} />}
      </dd>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: the value is on screen to copy by hand.
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Copy ${label.toLowerCase()}`}
      className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
