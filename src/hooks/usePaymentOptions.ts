import { useEffect, useState } from 'react'
import { shopApi } from '@/api'
import type { PaymentOptions } from '@/types'

// Asked once per page load; every payment form shares the answer.
let request: Promise<PaymentOptions> | null = null

/** Whether shops can pay online. `null` until the backend has answered. */
export function usePaymentOptions() {
  const [options, setOptions] = useState<PaymentOptions | null>(null)
  useEffect(() => {
    let active = true
    request ??= shopApi.paymentOptions().catch(() => {
      request = null // ask again next time
      return { onlinePayment: false }
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
