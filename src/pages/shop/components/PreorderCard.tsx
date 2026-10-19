import { Link } from 'react-router'
import { PATHS } from '@/routes/paths'
import type { ShopRound } from '@/types'
import { preorderState } from '../preorderState'
import { CatalogCard } from './CatalogCard'
import { cardButton } from './cardButton'
import { ImageBadge, ProductImage } from './ProductImage'

/**
 * A pre-order in the Pre-orders tab, laid out like a product card. Instead of "Add to cart" the
 * button opens the pre-order page to request boxes (or accept an offer, or see the order).
 */
export function PreorderCard({ round: r }: { round: ShopRound }) {
  const state = preorderState(r)
  return (
    <CatalogCard
      to={PATHS.preorder(r.id)}
      image={
        <ProductImage
          src={r.productImageUrl}
          alt={r.productName}
          setCode={r.productSetCode}
          game={r.productGame}
          hoverZoom
        >
          <ImageBadge tone={state.badgeTone}>{state.badge}</ImageBadge>
        </ProductImage>
      }
      sku={r.productSku}
      name={r.title}
      price={r.unitPrice}
      note={state.line}
      action={
        <Link
          to={state.action === 'View order' && r.myOrderId ? PATHS.order(r.myOrderId) : PATHS.preorder(r.id)}
          className={state.urgent ? cardButton.primary : cardButton.outline}
        >
          {state.action}
        </Link>
      }
    />
  )
}
