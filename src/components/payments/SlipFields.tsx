import { useEffect, useState } from 'react'
import { Field, Select, TextInput } from '@/components/ui'
import { PaymentDetails } from './PaymentDetails'
import { PAYMENT_METHODS } from '@/constants/status'
import type { SlipMethod, SlipUpload } from '@/types'
import { formatBaht } from '@/utils/format'
import { imageFileToDataUrl } from '@/utils/image'

interface SlipFieldsProps {
  amount: number
  /** Called with the complete slip, or null while something is missing. */
  onChange: (slip: SlipUpload | null) => void
}

/** Where to pay (PromptPay QR and bank account), payment method, transfer reference and the slip image (shrunk before upload). */
export function SlipFields({ amount, onChange }: SlipFieldsProps) {
  const [method, setMethod] = useState<SlipMethod>('PromptPay')
  const [reference, setReference] = useState('')
  const [slipImage, setSlipImage] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    onChange(slipImage ? { method, reference: reference.trim(), slipImage } : null)
  }, [method, reference, slipImage, onChange])

  async function pickFile(file: File | undefined) {
    setFileError(null)
    setSlipImage('')
    if (!file) return
    setReading(true)
    try {
      setSlipImage(await imageFileToDataUrl(file))
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not read the image')
    } finally {
      setReading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Pay <span className="font-mono font-semibold">{formatBaht(amount)}</span> by PromptPay or bank
        transfer, then attach the slip below.
      </p>
      <PaymentDetails amount={amount} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paid by" htmlFor="slip-method">
          <Select id="slip-method" value={method} onChange={(e) => setMethod(e.target.value as SlipMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Reference (optional)" htmlFor="slip-ref">
          <TextInput
            id="slip-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. last 4 digits"
          />
        </Field>
      </div>
      <Field
        label="Transfer slip"
        htmlFor="slip-file"
        error={fileError}
        hint={reading ? 'Reading the image…' : 'A photo or screenshot of the slip'}
      >
        <input
          id="slip-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => void pickFile(e.target.files?.[0])}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:text-foreground"
        />
      </Field>
      {slipImage && (
        <img
          src={slipImage}
          alt="Slip preview"
          className="max-h-56 rounded-md border border-border object-contain"
        />
      )}
    </div>
  )
}
