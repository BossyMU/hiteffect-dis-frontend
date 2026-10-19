import { useMemo } from 'react'
import { shopApi } from '@/api'
import { LoadState, Pagination } from '@/components/ui'
import { useApiData } from '@/hooks/useApiData'
import type { ShopRound } from '@/types'
import { PAGE_SIZE, filterCatalog, useCatalogParams } from './catalog'
import { CatalogToolbar } from './components/CatalogToolbar'
import { CatalogGrid } from './components/CatalogCard'
import { PreorderCard } from './components/PreorderCard'
import { ShopTabs } from './components/ShopTabs'
import { isTakingRequests } from './preorderState'

const fields = (r: ShopRound) => ({
  name: r.title,
  sku: r.productSku,
  setCode: r.productSetCode,
  category: r.productCategory,
  game: r.productGame,
  price: r.unitPrice,
})

/**
 * The Pre-orders tab: allocation-only products open for requests, in a card grid like the Products
 * tab. Shops request boxes here (no payment). Once requests close, the pre-order leaves this tab and
 * the shop follows it on My pre-orders (offer, deposit, balance, shipping).
 */
export default function PreordersPage() {
  const params = useCatalogParams()
  const { data, status, error, reload } = useApiData(() => shopApi.rounds())

  const rounds = useMemo(() => (data ?? []).filter(isTakingRequests), [data])
  // Search and sort only: few pre-orders are open at a time, so no category or set filter.
  const filtered = useMemo(
    () => filterCatalog(rounds, fields, { ...params, category: 'all', setCode: 'all' }),
    [rounds, params],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(params.page, pages)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
      <ShopTabs />
      <CatalogToolbar params={params} defaultSortLabel="Newest first" />

      <LoadState status={status} error={error} onRetry={reload}>
        <p className="font-mono text-xs text-muted-foreground">
          {filtered.length} pre-order{filtered.length === 1 ? '' : 's'} open for requests · Request now, pay a
          deposit only when you accept your offer
        </p>
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {rounds.length === 0
              ? 'No pre-orders are open right now. We will notify you when one opens.'
              : 'No pre-orders match.'}
          </p>
        ) : (
          <CatalogGrid>
            {paged.map((r) => (
              <PreorderCard key={r.id} round={r} />
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
    </div>
  )
}
