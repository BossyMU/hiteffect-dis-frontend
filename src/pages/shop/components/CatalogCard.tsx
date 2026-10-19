import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { formatBaht } from '@/utils/format'

/**
 * The card grid of a catalog tab. Each card spans 5 rows of the grid (photo, code, name, price,
 * button) through CSS subgrid, so a short name doesn't pull its price and button up: every card
 * in a row lines up with the others. Names longer than 3 lines end in "…" (see CatalogCard).
 */
export function CatalogGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>
}

interface CatalogCardProps {
  /** The product or pre-order page. */
  to: string
  image: ReactNode
  sku: string
  name: string
  price: number
  /** Short status on the right of the price ("12 in stock", "Closes 29 Oct"). */
  note: ReactNode
  /** The button at the bottom. */
  action: ReactNode
}

/**
 * One tile in a catalog grid, laid out like a distributor's storefront: photo, code, name (the
 * photo and name open the item's page), price, a short status and one button.
 */
export function CatalogCard({ to, image, sku, name, price, note, action }: CatalogCardProps) {
  const location = useLocation()
  // The item page's "back" link returns to this exact view (filters and page).
  const state = { from: location.pathname + location.search }
  return (
    <article className="group row-span-5 grid grid-rows-subgrid">
      <Link
        to={to}
        state={state}
        className="mb-3 block rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
      >
        {image}
      </Link>
      <p className="truncate font-mono text-xs text-muted-foreground" title={sku}>
        {sku}
      </p>
      {/* At most 3 lines, so one long name can't push its whole row down; the full name is on hover
          and on the item's page. */}
      <Link
        to={to}
        state={state}
        title={name}
        className="mt-0.5 line-clamp-3 text-sm leading-snug font-medium hover:underline"
      >
        {name}
      </Link>
      <div className="mt-2 mb-3 flex items-baseline justify-between gap-2">
        <p className="font-mono text-base font-semibold">{formatBaht(price)}</p>
        <p className="text-right text-xs text-muted-foreground">{note}</p>
      </div>
      <div className="mb-8">{action}</div>
    </article>
  )
}
