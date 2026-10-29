import JsBarcode from 'jsbarcode'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { adminApi } from '@/api'
import { BrandMark } from '@/components/layout'
import { LoadState } from '@/components/ui'
import { useApiData } from '@/hooks/useApiData'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import type { Order, User } from '@/types'
import { formatDate } from '@/utils/format'
import { formatWeight } from '@/utils/shipping'

/**
 * Thailand Post EMS shipping labels for one order, one per parcel, sized 100 × 150 mm (fits label
 * printers; on A4 they print one per page). Staff print them and stick them on the parcels.
 *
 * The barcode is the Thailand Post tracking number when the order has one (assigned from our range),
 * so the post office can scan it. Without one it is the order number, for our own reference: the
 * post office then issues the tracking number and staff type it in when marking the order shipped.
 */
export default function OrderLabelPage() {
  const { id = '' } = useParams()
  const { data, status, error, reload } = useApiData(
    () => Promise.all([adminApi.order(id), adminApi.shops('all')]),
    [id],
  )
  const order = data?.[0]
  const shop = data?.[1].find((s) => s.id === order?.userId) ?? null

  return (
    <div className="min-h-screen bg-muted p-6 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <LoadState status={status} error={error} onRetry={reload}>
        {order && <Labels order={order} shop={shop} />}
      </LoadState>
    </div>
  )
}

const PRINT_CSS = `
@page { size: 100mm 150mm; margin: 0; }
@media print {
  .no-print { display: none !important; }
  .label { box-shadow: none !important; margin: 0 !important; break-after: page; }
}
`

function Labels({ order, shop }: { order: Order; shop: User | null }) {
  const pickup = usePaymentOptions()?.pickup
  const parcels = order.shippingDetail?.parcels ?? [{ boxes: 0, grams: 0, postage: 0 }]
  const ems = order.deliveryMethod === 'ems'

  return (
    <div className="space-y-6">
      <div className="no-print mx-auto flex max-w-[100mm] flex-col gap-3 text-sm">
        {!ems && (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
            This order is picked up at the warehouse: it does not need a shipping label.
          </p>
        )}
        {order.status !== 'paid' && ems && (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
            This order is not paid and ready to ship (status: {order.status}).
          </p>
        )}
        {!order.trackingNo && (
          <p className="rounded-md border border-info/30 bg-info/5 px-3 py-2">
            No tracking number yet: the barcode is our order number. Hand the parcel in at the post office,
            then type the EMS number from the receipt when you mark the order shipped.
          </p>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:brightness-95"
        >
          Print {parcels.length} label{parcels.length === 1 ? '' : 's'}
        </button>
      </div>

      {parcels.map((p, i) => (
        <article
          key={i}
          className="label mx-auto flex h-[150mm] w-[100mm] flex-col overflow-hidden bg-white p-[5mm] text-[10pt] leading-snug text-black shadow-lg"
        >
          <header className="flex items-start justify-between border-b-2 border-black pb-[2mm]">
            <div>
              <p className="text-[16pt] leading-none font-black tracking-tight">EMS</p>
              <p className="text-[8pt]">ไปรษณีย์ด่วนพิเศษในประเทศ · Thailand Post</p>
            </div>
            <div className="text-right text-[8pt]">
              <p className="font-mono text-[10pt] font-bold">{order.orderNo}</p>
              <p>
                Parcel {i + 1} of {parcels.length}
                {p.grams > 0 && ` · ${formatWeight(p.grams)}`}
              </p>
            </div>
          </header>

          <section className="flex items-start justify-between gap-[3mm] border-b border-black py-[2mm] text-[8pt]">
            <div className="min-w-0">
              <p className="font-bold">ผู้ส่ง / FROM</p>
              <p>Deck Drive Distribution</p>
              <p className="whitespace-pre-line">{pickup?.address || 'Deck Drive Distribution warehouse'}</p>
            </div>
            <BrandMark className="h-[7mm] shrink-0" />
          </section>

          <section className="flex-1 py-[3mm]">
            <p className="text-[8pt] font-bold">ผู้รับ / TO</p>
            <p className="text-[13pt] font-bold">{shop?.contactName || order.shopName}</p>
            {shop?.contactName && <p className="text-[10pt]">{order.shopName}</p>}
            <p className="mt-[1mm] text-[11pt] whitespace-pre-line">
              {order.shipAddress || '— no address —'}
            </p>
            {shop?.phone && <p className="mt-[1mm] text-[11pt] font-semibold">Tel. {shop.phone}</p>}
            {order.shippingDetail?.postcode && (
              <p className="mt-[2mm] inline-block border-2 border-black px-[2mm] font-mono text-[18pt] font-bold tracking-[0.2em]">
                {order.shippingDetail.postcode}
              </p>
            )}
          </section>

          <section className="border-t-2 border-black pt-[2mm] text-center">
            <Barcode value={order.trackingNo || order.orderNo} />
            <p className="text-[7pt]">
              {order.trackingNo ? 'Thailand Post tracking number' : 'Order reference (not a tracking number)'}
            </p>
          </section>

          <footer className="mt-[2mm] border-t border-dashed border-black pt-[1.5mm] text-[7pt]">
            <p className="font-bold">Contents{parcels.length > 1 ? ' (whole order)' : ''}</p>
            <ul>
              {order.items.map((it) => (
                <li key={it.productId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {it.sku} · {it.productName}
                  </span>
                  <span className="shrink-0 font-mono">× {it.qty}</span>
                </li>
              ))}
            </ul>
            <p className="mt-[1mm] text-right">Printed {formatDate(new Date().toISOString())}</p>
          </footer>
        </article>
      ))}
    </div>
  )
}

/** A Code 128 barcode as SVG (what post office scanners read). */
function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!ref.current) return
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      width: 1.8,
      height: 48,
      fontSize: 14,
      font: 'monospace',
      margin: 0,
      displayValue: true,
    })
  }, [value])
  return <svg ref={ref} className="mx-auto max-w-full" role="img" aria-label={`Barcode ${value}`} />
}
