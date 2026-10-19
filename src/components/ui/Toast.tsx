import { cn } from '@/utils/cn'

interface ToastProps {
  kind: 'error' | 'success'
  message: string
  onDismiss: () => void
}

/** Dismissible message shown bottom-right, above modals. */
export function Toast({ kind, message, onDismiss }: ToastProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed right-4 bottom-20 z-[60] flex max-w-sm items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-xl md:bottom-6',
        kind === 'error' ? 'border-danger/40' : 'border-success/40',
      )}
    >
      <span className={kind === 'error' ? 'text-danger' : 'text-success'} aria-hidden>
        {kind === 'error' ? '⚠' : '✓'}
      </span>
      <p className="flex-1 text-foreground">{message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </div>
  )
}
