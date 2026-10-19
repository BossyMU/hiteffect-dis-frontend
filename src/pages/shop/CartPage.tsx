import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { shopApi } from '@/api'
import { Button, Card, Field, LoadState, PageHeader, TextArea } from '@/components/ui'
import { orderLimit, useCart, type CartLine } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { ShopProduct, ShopRound } from '@/types'
import { boxes, formatBaht, formatDate } from '@/utils/format'
import { ProductImage } from './components/ProductImage'
import { QtyStepper } from './components/QtyStepper'
import { ShopTabs } from './components/ShopTabs'

/** A cart line checked against the current product: price, and how many can still be ordered. */
interface CheckedLine {
  line: CartLine
  product: ShopProduct | null
  qty: number
  limit: number
}

/** The cart for in-stock products, and a reminder of the shop's open pre-order requests. */
export default function CartPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const { run } = useToast()
  const { data, status, error, reload } = useApiData(() =>
    Promise.all([shopApi.products(), shopApi.rounds()]),
  )
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const checked = useMemo<CheckedLine[]>(() => {
    const byId = new Map((data?.[0] ?? []).map((p) => [p.id, p]))
    return cart.lines.map((line) => {
      const product = byId.get(line.productId) ?? null
      const limit = product ? orderLimit(product) : 0
      return { line, product, limit, qty: Math.min(line.qty, limit) }
    })
  }, [cart.lines, data])
  const orderable = checked.filter((c) => c.product && c.qty > 0)
  const count = orderable.reduce((s, c) => s + c.qty, 0)
  const total = orderable.reduce((s, c) => s + c.qty * c.product!.price, 0)
  const requests = (data?.[1] ?? []).filter(
    (r) => r.status === 'open' && r.myPreorder?.status === 'submitted',
  )

  async function placeOrder() {
    setBusy(true)
    let orderId = ''
    const ok = await run(async () => {
      const order = await shopApi.placeOrder(
        orderable.map((c) => ({ productId: c.product!.id, qty: c.qty })),
        note.trim(),
      )
      orderId = order.id
    }, 'Order placed. Please pay to confirm it.')
    setBusy(false)
    if (ok) {
      cart.clear()
      navigate(PATHS.order(orderId))
    } else {
      void reload()
    }
  }

  return (
    <div className="space-y-5">
      <ShopTabs />
      <PageHeader title="Cart" subtitle="In-stock products. Prices per box, before VAT." />
      <LoadState status={status} error={error} onRetry={reload}>
        {cart.lines.length === 0 ? (
          <Card className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Link to={PATHS.products} className="text-sm font-semibold text-info hover:underline">
              Browse products →
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {checked.map((c) => (
                <CartRow
                  key={c.line.productId}
                  item={c}
                  onQty={(qty) => c.product && cart.setQty(c.product, qty)}
                  onRemove={() => cart.remove(c.line.productId)}
                />
              ))}
            </ul>

            <Card className="space-y-4 self-start lg:sticky lg:top-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{boxes(count)}</span>
                <span className="font-mono text-2xl font-semibold text-primary-strong">
                  {formatBaht(total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Total before VAT.</p>
              <Field label="Note (optional)" htmlFor="order-note">
                <TextArea id="order-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button
                className="w-full py-3"
                onClick={() => void placeOrder()}
                disabled={busy || count === 0}
              >
                {busy ? 'Placing…' : 'Place order'}
              </Button>
              <p className="text-xs text-muted-foreground">
                The boxes are held for you until you pay. Pay by 23:59 today (Bangkok time), or the order is
                cancelled and the boxes go back to stock.
              </p>
            </Card>
          </div>
        )}

        {requests.length > 0 && <PreorderRequests rounds={requests} />}
      </LoadState>
    </div>
  )
}

function CartRow({
  item: c,
  onQty,
  onRemove,
}: {
  item: CheckedLine
  onQty: (qty: number) => void
  onRemove: () => void
}) {
  const p = c.product
  const unavailable = !p || c.limit === 0
  return (
    <li className="flex gap-4 p-4">
      <Link to={p ? PATHS.product(p.id) : PATHS.products} className="w-20 shrink-0">
        <ProductImage
          src={c.line.imageUrl}
          alt=""
          setCode={p?.setCode ?? ''}
          game={p?.game ?? ''}
          className="[&_img]:p-1.5"
        />
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={p ? PATHS.product(p.id) : PATHS.products}
              className="text-sm font-medium hover:underline"
            >
              {p?.name ?? c.line.name}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              {c.line.sku} · {formatBaht(p?.price ?? c.line.price)} per box
            </p>
          </div>
          <p className="font-mono text-sm font-semibold">{unavailable ? '—' : formatBaht(c.qty * p.price)}</p>
        </div>
        {unavailable ? (
          <p className="text-sm text-danger">No longer available.</p>
        ) : (
          <>
            <QtyStepper value={c.qty} max={c.limit} onChange={onQty} label={p.name} className="w-36" />
            {c.line.qty > c.limit && (
              <p className="text-xs text-warning">
                Only {boxes(c.limit)} available, so we lowered the quantity.
              </p>
            )}
            {p.price !== c.line.price && (
              <p className="text-xs text-muted-foreground">The price changed since you added it.</p>
            )}
          </>
        )}
        <button type="button" onClick={onRemove} className="text-xs text-muted-foreground hover:text-danger">
          Remove
        </button>
      </div>
    </li>
  )
}

/** Requests are not part of the order: a reminder of what the shop asked for, with links. */
function PreorderRequests({ rounds }: { rounds: ShopRound[] }) {
  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-base font-semibold">Your pre-order requests</h2>
      <p className="text-sm text-muted-foreground">
        These are not part of this order and there is nothing to pay yet. You will get an offer after requests
        close.
      </p>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {rounds.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <Link to={PATHS.preorder(r.id)} className="text-sm font-medium hover:underline">
                {r.title}
              </Link>
              <p className="text-xs text-muted-foreground">Requests close {formatDate(r.requestDeadline)}</p>
            </div>
            <span className="font-mono text-sm whitespace-nowrap">{boxes(r.myPreorder!.requestedQty)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
