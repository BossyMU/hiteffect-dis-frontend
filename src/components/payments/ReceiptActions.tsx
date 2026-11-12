import { useState } from 'react'
import { adminApi, authApi, errorMessage } from '@/api'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/utils/cn'

const linkButton =
  'font-semibold text-info hover:underline disabled:cursor-wait disabled:opacity-60 disabled:no-underline'

/**
 * A payment's receipt (ใบเสร็จรับเงิน): open it (to read or print), download the PDF, and for staff,
 * e-mail it to the shop again. The PDF comes from the API with the login, so it is fetched here.
 */
export function ReceiptActions({
  receiptId,
  receiptNo,
  staff = false,
  className,
}: {
  receiptId: string
  receiptNo: string
  staff?: boolean
  className?: string
}) {
  const { showError, run } = useToast()
  const [busy, setBusy] = useState<'open' | 'download' | 'email' | null>(null)

  async function pdfUrl() {
    return URL.createObjectURL(await authApi.receiptPdf(receiptId))
  }

  async function open() {
    // Open the tab now, while the click still counts (pop-up blockers), then load the PDF into it.
    const tab = window.open('', '_blank')
    setBusy('open')
    try {
      const url = await pdfUrl()
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch (err) {
      tab?.close()
      showError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function download() {
    setBusy('download')
    try {
      const url = await pdfUrl()
      const a = document.createElement('a')
      a.href = url
      a.download = `${receiptNo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (err) {
      showError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function email() {
    setBusy('email')
    await run(() => adminApi.emailReceipt(receiptId), `Receipt ${receiptNo} e-mailed to the shop`)
    setBusy(null)
  }

  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
      <span>
        Receipt <span className="font-mono font-semibold">{receiptNo}</span>
      </span>
      <button type="button" className={linkButton} disabled={busy !== null} onClick={() => void open()}>
        {busy === 'open' ? 'Opening…' : 'View'}
      </button>
      <button type="button" className={linkButton} disabled={busy !== null} onClick={() => void download()}>
        {busy === 'download' ? 'Preparing…' : 'Download PDF'}
      </button>
      {staff && (
        <button type="button" className={linkButton} disabled={busy !== null} onClick={() => void email()}>
          {busy === 'email' ? 'Sending…' : 'E-mail again'}
        </button>
      )}
    </p>
  )
}
