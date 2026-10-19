import type { ReactNode } from 'react'

interface StatusPanelProps {
  title: string
  message?: ReactNode
  action?: ReactNode
}

/** Centered message, e.g. while loading or when the API is unreachable. */
export function StatusPanel({ title, message, action }: StatusPanelProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {message && <p className="max-w-md text-sm text-muted-foreground">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
