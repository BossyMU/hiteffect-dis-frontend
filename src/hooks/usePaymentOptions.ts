import { useEffect, useState } from 'react'
import { shopApi } from '@/api'
import type { PaymentOptions } from '@/types'

/** Used when the backend can't be asked: nothing optional switched on. */
const OFFLINE_DEFAULTS: PaymentOptions = {
  onlinePayment: false,
  pickup: { address: '', hours: '' },
  thaipost: { autoTrackingNo: false, tracking: false },
}

// Asked once per page load; every form shares the answer.
let request: Promise<PaymentOptions> | null = null

/** Online payment, pick-up place and Thailand Post features. `null` until the backend has answered. */
export function usePaymentOptions() {
  const [options, setOptions] = useState<PaymentOptions | null>(null)
  useEffect(() => {
    let active = true
    request ??= shopApi.paymentOptions().catch(() => {
      request = null // ask again next time
      return OFFLINE_DEFAULTS
    })
    void request.then((o) => {
      if (active) setOptions(o)
    })
    return () => {
      active = false
    }
  }, [])
  return options
}
