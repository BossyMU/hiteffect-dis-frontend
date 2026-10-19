import type { ReactNode } from 'react'
import type { LoadStatus } from '@/hooks/useApiData'
import { Button } from './Button'
import { StatusPanel } from './StatusPanel'

/** Shows "Loading…" or the load error with a Retry button; renders children once the data is ready. */
export function LoadState({
  status,
  error,
  onRetry,
  children,
}: {
  status: LoadStatus
  error: string | null
  onRetry: () => void
  children: ReactNode
}) {
  if (status === 'loading') return <StatusPanel title="Loading…" />
  if (status === 'error') {
    return (
      <StatusPanel
        title="Can't load this page"
        message={error}
        action={<Button onClick={onRetry}>Retry</Button>}
      />
    )
  }
  return <>{children}</>
}
