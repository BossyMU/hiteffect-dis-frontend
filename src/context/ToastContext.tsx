import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { errorMessage } from '@/api'
import { Toast } from '@/components/ui/Toast'

interface ToastState {
  kind: 'error' | 'success'
  message: string
}

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

  const show = useCallback((kind: ToastState['kind'], message: string) => {
    setToast({ kind, message })
    if (kind === 'success')
      window.setTimeout(() => setToast((t) => (t?.message === message ? null : t)), 4000)
  }, [])

  const value = useMemo<Toasts>(
    () => ({
      showError: (message) => show('error', message),
      showSuccess: (message) => show('success', message),
      run: async (action, successMessage) => {
        try {
          await action()
          if (successMessage) show('success', successMessage)
          else setToast(null)
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
