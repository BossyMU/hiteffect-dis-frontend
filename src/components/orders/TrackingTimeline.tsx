import { useState } from 'react'
import { errorMessage } from '@/api'
import { Button } from '@/components/ui'
import type { TrackingStatus } from '@/types'
import { formatDateTime } from '@/utils/format'

/** Where the parcel is, from Thailand Post's tracking, loaded when someone asks. */
export function TrackingTimeline({ load }: { load: () => Promise<TrackingStatus> }) {
  const [state, setState] = useState<{ data?: TrackingStatus; error?: string; loading?: boolean }>({})
  async function refresh() {
    setState({ loading: true })
    try {
      setState({ data: await load() })
    } catch (err) {
      setState({ error: errorMessage(err) })
    }
  }
  if (!state.data && !state.loading && !state.error) {
    return (
      <Button variant="secondary" size="sm" onClick={() => void refresh()}>
        Track parcel
      </Button>
    )
  }
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {state.data?.delivered ? '✓ Delivered' : 'Thailand Post tracking'}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={state.loading}
          className="text-xs font-semibold text-info hover:underline"
        >
          {state.loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.data && state.data.events.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No scans yet. Thailand Post updates within a few hours of drop-off.
        </p>
      )}
      <ol className="space-y-2">
        {state.data?.events.map((e, i) => (
          <li key={i} className="text-xs">
            <p className={i === 0 ? 'font-semibold' : ''}>
              {e.description}
              {e.receiver && ` · received by ${e.receiver}`}
            </p>
            <p className="text-muted-foreground">
              {e.at ? formatDateTime(e.at) : ''}
              {e.location && ` · ${e.location}`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
