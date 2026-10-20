import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { errorMessage } from '@/api'
import { Toast } from '@/components/ui/Toast'

interface ToastState {
  id: number
  kind: 'error' | 'success'
  message: string
}

/** How long a success message stays: at least 8 seconds, longer for long messages, at most 15. Errors stay until dismissed. */
const successDuration = (message: string) => Math.min(15_000, 8_000 + message.length * 40)

interface Toasts {
  showError: (message: string) => void
  showSuccess: (message: string) => void
  /**
   * Run an API action. Resolves to `true` on success (and shows `successMessage` if given);
   * on failure shows the error as a toast and resolves to `false`, so modals can stay open.
   */
  run: (action: () => Promise<unknown>, successMessage?: string) => Promise<boolean>
}

const ToastContext = createContext<Toasts | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const lastId = useRef(0)

  const show = useCallback((kind: ToastState['kind'], message: string) => {
    const id = ++lastId.current
    setToast({ id, kind, message })
    // Only close this message, not a newer one shown in the meantime.
    if (kind === 'success')
      window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), successDuration(message))
  }, [])

  const value = useMemo<Toasts>(
    () => ({
      showError: (message) => show('error', message),
      showSuccess: (message) => show('success', message),
      run: async (action, successMessage) => {
        try {
          await action()
          if (successMessage) show('success', successMessage)
          // Clear an earlier error, but keep a success message the action showed itself.
          else setToast((t) => (t?.kind === 'error' ? null : t))
          return true
        } catch (err) {
          show('error', errorMessage(err))
          return false
        }
      },
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
