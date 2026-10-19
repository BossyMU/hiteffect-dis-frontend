import { useEffect, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Panel width, e.g. 'max-w-lg'. */
  className?: string
}

/** Centered dialog over a dimmed backdrop. Closes on backdrop click or Escape. */
export function Modal({ title, onClose, children, footer, className }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,19,28,0.62)] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/** "Cancel" + primary action pair used at the bottom of modals. */
export function ModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
  busy,
  disabled,
  destructive,
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: ReactNode
  busy?: boolean
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        variant={destructive ? 'destructive' : 'primary'}
        onClick={onConfirm}
        disabled={busy || disabled}
      >
        {busy ? 'Saving…' : confirmLabel}
      </Button>
    </>
  )
}
