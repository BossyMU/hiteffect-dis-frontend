import { APP_ENV } from '@/config/env'

/**
 * A strip across the top on every non-production copy, so nobody mistakes test data for real orders.
 * Production shows nothing.
 */
export function EnvBanner() {
  if (APP_ENV === 'production') return null
  return (
    <div
      role="note"
      className="flex shrink-0 items-center justify-center gap-2 bg-warning px-3 py-1 text-center font-mono text-[11px] tracking-[1.5px] text-white uppercase"
    >
      <span className="font-semibold">{APP_ENV === 'uat' ? 'UAT' : 'Local'}</span>
      <span className="opacity-90">Test copy · orders and payments here are not real</span>
    </div>
  )
}
