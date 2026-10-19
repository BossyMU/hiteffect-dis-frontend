import { useMemo } from 'react'
import { Link } from 'react-router'
import { shopApi } from '@/api'
import { FilterChip, LoadState, Pagination } from '@/components/ui'
import { useUser } from '@/context/AuthContext'
import { orderLimit, useCart } from '@/context/CartContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { ShopProduct } from '@/types'
import { boxes, formatBaht } from '@/utils/format'
import { PAGE_SIZE, filterCatalog, isStockProduct, optionsOf, useCatalogParams } from './catalog'
import { CatalogToolbar } from './components/CatalogToolbar'
import { CatalogGrid } from './components/CatalogCard'
import { ProductCard } from './components/ProductCard'
import { ShopTabs } from './components/ShopTabs'

const fields = (p: ShopProduct) => p

/** The Products tab: a card grid of products sold from stock, with a cart. */
export default function ProductsPage() {
  const user = useUser()
  const cart = useCart()
  const params = useCatalogParams()
  const { data, status, error, reload } = useApiData(() => shopApi.products())

  const products = useMemo(() => (data ?? []).filter(isStockProduct), [data])
  const inStockOnly = params.show === 'in_stock'
  const filtered = useMemo(
    () => filterCatalog(products, fields, params).filter((p) => !inStockOnly || orderLimit(p) > 0),
    [products, params, inStockOnly],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(params.page, pages)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <ShopTabs />
      <CatalogToolbar
        params={params}
        categories={optionsOf(products, (p) => p.category)}
        sets={optionsOf(products, (p) => p.setCode)}
        defaultSortLabel="Newest first"
      >
        <FilterChip
          active={inStockOnly}
          onClick={() => params.update({ show: inStockOnly ? null : 'in_stock' })}
        >
          In stock only
        </FilterChip>
      </CatalogToolbar>

      <LoadState status={status} error={error} onRetry={reload}>
        <p className="font-mono text-xs text-muted-foreground">
          {filtered.length} product{filtered.length === 1 ? '' : 's'} · {user.tierName ?? ''} tier prices per
          box, before VAT
        </p>
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No products match.</p>
        ) : (
          <CatalogGrid>
            {paged.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </CatalogGrid>
        )}
        <Pagination
          page={page}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={(n) => {
            params.update({ page: n })
            window.scrollTo({ top: 0 })
          }}
        />
      </LoadState>

      {cart.count > 0 && (
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-primary/40 bg-card px-4 py-3 shadow-[0_-8px_24px_rgba(23,26,31,0.08)] md:-mx-8 md:px-8">
          <p className="text-sm">
            <span className="font-semibold">{boxes(cart.count)} in your cart</span>{' '}
            <span className="font-mono text-muted-foreground">· {formatBaht(cart.total)}</span>
          </p>
          <Link
            to={PATHS.cart}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95"
          >
            View cart
          </Link>
        </div>
      )}
    </div>
  )
}
