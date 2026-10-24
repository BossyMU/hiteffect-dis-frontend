import { orderLimit, useCart } from '@/context/CartContext'
import { PATHS } from '@/routes/paths'
import type { ShopProduct } from '@/types'
import { CatalogCard } from './CatalogCard'
import { cardButton } from './cardButton'
import { ImageBadge, ProductImage } from './ProductImage'
import { QtyStepper } from './QtyStepper'

/**
 * A product in the Products tab. The photo and name open the product page; the button adds a box
 * to the cart, then becomes a − / + stepper. Sold-out products can't be added.
 *
 * No pre-order tag here, even when the next shipment is on pre-order: everything on this tab is
 * bought from stock, and a tag made shops think they were pre-ordering. The product page mentions
 * the pre-order instead.
 */
export function ProductCard({ product: p }: { product: ShopProduct }) {
  const cart = useCart()
  const limit = orderLimit(p)
  const inCart = Math.min(cart.qtyOf(p.id), limit)
  const soldOut = limit === 0

  return (
    <CatalogCard
      to={PATHS.product(p.id)}
      image={
        <ProductImage src={p.imageUrl} alt={p.name} setCode={p.setCode} game={p.game} hoverZoom>
          {soldOut && <ImageBadge tone="muted">Sold out</ImageBadge>}
        </ProductImage>
      }
      sku={p.sku}
      name={p.name}
      price={p.price}
      note={soldOut ? 'Out of stock' : `${p.available} in stock`}
      action={
        soldOut ? (
          <button type="button" disabled className={cardButton.disabled}>
            Sold out
          </button>
        ) : inCart > 0 ? (
          <QtyStepper
            value={inCart}
            max={limit}
            onChange={(qty) => cart.setQty(p, qty)}
            label={p.name}
            text={`${inCart} in cart`}
          />
        ) : (
          <button type="button" onClick={() => cart.setQty(p, 1)} className={cardButton.outline}>
            Add to cart
          </button>
        )
      }
    />
  )
}
