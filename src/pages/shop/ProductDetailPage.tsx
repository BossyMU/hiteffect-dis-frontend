import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { shopApi } from '@/api'
import { LoadState } from '@/components/ui'
import { useUser } from '@/context/AuthContext'
import { orderLimit, useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { ShopProduct } from '@/types'
import { boxes, formatBaht } from '@/utils/format'
import { cardButton } from './components/cardButton'
import { Description, DetailLayout, ItemOverline, ProductFacts } from './components/DetailLayout'
import { ImageBadge, ProductImage } from './components/ProductImage'
import { QtyStepper } from './components/QtyStepper'
import { ShopTabs } from './components/ShopTabs'
import { isTakingRequests } from './preorderState'

/** One product: photo, tier price, stock, quantity and "Add to cart". */
export default function ProductDetailPage() {
  const { id = '' } = useParams()
  const { data, status, error, reload } = useApiData(() => shopApi.product(id), [id])

  return (
    <div className="space-y-5">
      <ShopTabs />
      <LoadState status={status} error={error} onRetry={reload}>
        {data && <ProductDetail key={data.id} product={data} />}
      </LoadState>
    </div>
  )
}

function ProductDetail({ product: p }: { product: ShopProduct }) {
  const user = useUser()
  const cart = useCart()
  const { showSuccess } = useToast()
  const limit = orderLimit(p)
  const inCart = Math.min(cart.qtyOf(p.id), limit)
  const room = limit - inCart
  const [qty, setQty] = useState(1)
  const soldOut = limit === 0

  function add() {
    const n = Math.min(qty, room)
    if (n < 1) return
    cart.setQty(p, inCart + n)
    showSuccess(`Added ${boxes(n)} to your cart`)
    setQty(1)
  }

  return (
    <DetailLayout
      backTo={PATHS.products}
      backLabel="Products"
      image={
        <ProductImage src={p.imageUrl} alt={p.name} setCode={p.setCode} game={p.game}>
          {soldOut && <ImageBadge tone="muted">Sold out</ImageBadge>}
        </ProductImage>
      }
    >
      <div className="space-y-2">
        <ItemOverline parts={[p.game, p.category]} />
        <h1 className="text-2xl leading-tight font-semibold md:text-3xl">{p.name}</h1>
        <p className="font-mono text-sm text-muted-foreground">{p.sku}</p>
      </div>

      <div>
        <p className="font-mono text-2xl font-semibold">{formatBaht(p.price)}</p>
        <p className="text-xs text-muted-foreground">
          Per box, including VAT · {user.tierName ?? 'your'} tier price
        </p>
      </div>

      <p className={soldOut ? 'text-sm text-muted-foreground' : 'text-sm font-medium text-success'}>
        {soldOut ? 'Sold out' : `In stock: ${boxes(p.available)}`}
        {p.maxPerOrder != null && !soldOut && (
          <span className="font-normal text-muted-foreground"> · up to {p.maxPerOrder} per order</span>
        )}
      </p>

      {p.activeRound && isTakingRequests(p.activeRound) && (
        <p className="rounded-lg border border-ring/40 bg-ring/5 px-4 py-3 text-sm">
          {soldOut
            ? 'Sold out for now. The next shipment is open for pre-order requests: '
            : 'You are ordering boxes we have in stock now. Separately, the next shipment is open for pre-order requests: '}
          <Link to={PATHS.preorder(p.activeRound.id)} className="font-semibold text-info hover:underline">
            see the pre-order →
          </Link>
        </p>
      )}

      {!soldOut && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Quantity</p>
          <QtyStepper
            value={Math.min(qty, Math.max(1, room))}
            max={Math.max(1, room)}
            onChange={setQty}
            label={p.name}
            className="w-40"
          />
        </div>
      )}

      <div className="space-y-2">
        {soldOut ? (
          <button type="button" disabled className={cardButton.disabled}>
            Sold out
          </button>
        ) : room < 1 ? (
          <button type="button" disabled className={cardButton.disabled}>
            All available boxes are in your cart
          </button>
        ) : (
          <button type="button" onClick={add} className={`${cardButton.primary} py-3 text-base`}>
            Add to cart
          </button>
        )}
        {inCart > 0 && (
          <p className="text-sm">
            {boxes(inCart)} in your cart ·{' '}
            <Link to={PATHS.cart} className="font-semibold text-info hover:underline">
              View cart →
            </Link>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Boxes are held for you once you place the order. Pay by 23:59 today (Bangkok time), or the order is
          cancelled.
        </p>
      </div>

      <ProductFacts
        sku={p.sku}
        category={p.category}
        setCode={p.setCode}
        boxesPerCase={p.boxesPerCase}
        releaseDate={p.releaseDate}
      />
      <Description text={p.description} />
    </DetailLayout>
  )
}
