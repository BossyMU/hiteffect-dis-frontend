import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, isAbort } from '@/api'

export type LoadStatus = 'loading' | 'ready' | 'error'

/**
 * Load data for a page from the API and keep it in state.
 * `reload()` fetches again (after an action); `setData` lets an action store what the server returned.
 * Pass the inputs the loader depends on in `deps`.
 */
export function useApiData<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  const reload = useCallback(async () => {
    try {
      const result = await loadRef.current()
      setData(result)
      setError(null)
      setStatus('ready')
    } catch (err) {
      if (isAbort(err)) return
      setError(errorMessage(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    // Initial load (and again whenever deps change); reload() only sets state after its request settles.
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, setData, status, error, reload }
}
