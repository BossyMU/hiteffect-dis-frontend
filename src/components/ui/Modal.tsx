import { useEffect, useRef, type ReactNode } from 'react'
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

/**
 * Centered dialog over a dimmed backdrop. Closes on Escape, or on a click on the backdrop itself:
 * the press and the release must both be on it. (A press inside the dialog that ends outside, e.g.
 * selecting text in a field and letting go past the edge, is a "click" on the backdrop too, and
 * used to close the dialog and lose what was typed.)
 */
export function Modal({ title, onClose, children, footer, className }: ModalProps) {
  const pressedOnBackdrop = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,19,28,0.62)] p-4"
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget
      }}
      onPointerUp={(e) => {
        // Released inside the dialog: not a backdrop click, wherever the press started.
        if (e.target !== e.currentTarget) pressedOnBackdrop.current = false
      }}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose()
        pressedOnBackdrop.current = false
      }}
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
