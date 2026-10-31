import JsBarcode from 'jsbarcode'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { adminApi } from '@/api'
import { BrandMark } from '@/components/layout'
import { LoadState } from '@/components/ui'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
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
    () => Promise.all([adminApi.order(id), adminApi.shops('all'), adminApi.labelSender()]),
    [id],
  )
  const order = data?.[0]
  const shop = data?.[1].find((s) => s.id === order?.userId) ?? null
  const sender = data?.[2]

  return (
    <div className="min-h-screen bg-muted p-6 print:bg-white print:p-0">
      <style>{PRINT_CSS}</style>
      <LoadState status={status} error={error} onRetry={reload}>
        {order && sender && <Labels order={order} shop={shop} sender={sender} />}
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

interface Sender {
  name: string
  address: string
  phone: string
}

/** Contents lines on a label; more items are summed up in one line, so the label never overflows. */
const MAX_CONTENT_LINES = 3

function Labels({ order, shop, sender }: { order: Order; shop: User | null; sender: Sender }) {
  const parcels = order.shippingDetail?.parcels ?? [{ boxes: 0, grams: 0, postage: 0 }]
  const ems = order.deliveryMethod === 'ems'
  const notice = 'rounded-md border border-warning/40 bg-warning/10 px-3 py-2'

  return (
    <div className="space-y-6">
      <div className="no-print mx-auto flex max-w-[100mm] flex-col gap-3 text-sm">
        {!ems && (
          <p className={notice}>
            This order is picked up at the warehouse: it does not need a shipping label.
          </p>
        )}
        {order.status !== 'paid' && ems && (
          <p className={notice}>This order is not paid and ready to ship (status: {order.status}).</p>
        )}
        {(!sender.address || !sender.phone) && (
          <p className={notice}>
            Your profile has no {!sender.address ? 'warehouse address' : 'phone number'}
            {!sender.address && !sender.phone ? ' or phone number' : ''}, so it is missing from the sender on
            the label.{' '}
            <Link to={PATHS.profile} className="font-semibold underline">
              Add it in Profile
            </Link>
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
        <Label
          key={i}
          order={order}
          shop={shop}
          sender={sender}
          parcel={{ number: i + 1, of: parcels.length, grams: p.grams }}
        />
      ))}
    </div>
  )
}

/**
 * One 100 × 150 mm label. The addresses sit in a box between the header and the barcode whose text
 * shrinks until it fits, so a long address gets smaller instead of pushing the barcode and contents
 * off the label.
 */
function Label({
  order,
  shop,
  sender,
  parcel,
}: {
  order: Order
  shop: User | null
  sender: Sender
  parcel: { number: number; of: number; grams: number }
}) {
  const fitRef = useFitText<HTMLDivElement>(10, 6, [order, shop, sender])
  const shown =
    order.items.length > MAX_CONTENT_LINES ? order.items.slice(0, MAX_CONTENT_LINES - 1) : order.items
  const rest = order.items.slice(shown.length)
  const restBoxes = rest.reduce((sum, it) => sum + it.qty, 0)

  return (
    <article className="label mx-auto flex h-[150mm] w-[100mm] flex-col overflow-hidden bg-white p-[5mm] text-[10pt] leading-snug text-black shadow-lg">
      <header className="flex shrink-0 items-start justify-between border-b-2 border-black pb-[2mm]">
        <div>
          <p className="text-[16pt] leading-none font-black tracking-tight">EMS</p>
          <p className="text-[8pt]">ไปรษณีย์ด่วนพิเศษในประเทศ · Thailand Post</p>
        </div>
        <div className="text-right text-[8pt]">
          <p className="font-mono text-[10pt] font-bold">{order.orderNo}</p>
          <p>
            Parcel {parcel.number} of {parcel.of}
            {parcel.grams > 0 && ` · ${formatWeight(parcel.grams)}`}
          </p>
        </div>
      </header>

      {/* Sizes in em, of a base the fitting sets (10pt, smaller when the addresses are long). */}
      <div ref={fitRef} className="min-h-0 flex-1 overflow-hidden [overflow-wrap:anywhere]">
        <section className="flex items-start justify-between gap-[3mm] border-b border-black py-[2mm] text-[0.8em]">
          <div className="min-w-0">
            <p className="font-bold">ผู้ส่ง / FROM</p>
            <p>{sender.name}</p>
            {sender.address && <p className="whitespace-pre-line">{sender.address}</p>}
            {sender.phone && <p className="font-semibold">Tel. {sender.phone}</p>}
          </div>
          <BrandMark className="h-[7mm] shrink-0" />
        </section>

        <section className="py-[2.5mm]">
          <p className="text-[0.8em] font-bold">ผู้รับ / TO</p>
          <p className="text-[1.3em] font-bold">{shop?.contactName || order.shopName}</p>
          {shop?.contactName && <p>{order.shopName}</p>}
          <p className="mt-[1mm] text-[1.1em] whitespace-pre-line">{order.shipAddress || '— no address —'}</p>
          {shop?.phone && <p className="mt-[1mm] text-[1.1em] font-semibold">Tel. {shop.phone}</p>}
          {order.shippingDetail?.postcode && (
            <p className="mt-[2mm] inline-block border-2 border-black px-[2mm] font-mono text-[1.8em] font-bold tracking-[0.2em]">
              {order.shippingDetail.postcode}
            </p>
          )}
        </section>
      </div>

      <section className="shrink-0 border-t-2 border-black pt-[2mm] text-center">
        <Barcode value={order.trackingNo || order.orderNo} />
        <p className="text-[7pt]">
          {order.trackingNo ? 'Thailand Post tracking number' : 'Order reference (not a tracking number)'}
        </p>
      </section>

      <footer className="mt-[2mm] shrink-0 border-t border-dashed border-black pt-[1.5mm] text-[7pt]">
        <p className="font-bold">Contents{parcel.of > 1 ? ' (whole order)' : ''}</p>
        <ul>
          {shown.map((it) => (
            <li key={it.productId} className="flex justify-between gap-2">
              <span className="truncate">
                {it.sku} · {it.productName}
              </span>
              <span className="shrink-0 font-mono">× {it.qty}</span>
            </li>
          ))}
          {rest.length > 0 && (
            <li className="flex justify-between gap-2">
              <span>
                + {rest.length} more item{rest.length === 1 ? '' : 's'}
              </span>
              <span className="shrink-0 font-mono">× {restBoxes}</span>
            </li>
          )}
        </ul>
        <p className="mt-[1mm] text-right">Printed {formatDate(new Date().toISOString())}</p>
      </footer>
    </article>
  )
}

/**
 * Sets the element's font size to `basePt`, then lowers it until its content fits its height (down to
 * `minPt`). Fits again when the box changes size, when fonts finish loading, and before printing.
 */
function useFitText<T extends HTMLElement>(basePt: number, minPt: number, deps: unknown[]) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      let size = basePt
      el.style.fontSize = `${size}pt`
      while (el.scrollHeight > el.clientHeight + 1 && size > minPt) {
        size = Math.max(minPt, size - 0.25)
        el.style.fontSize = `${size}pt`
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    void document.fonts?.ready.then(fit)
    window.addEventListener('beforeprint', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('beforeprint', fit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePt, minPt, ...deps])
  return ref
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
