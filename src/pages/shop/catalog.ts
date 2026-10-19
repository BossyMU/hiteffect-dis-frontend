/**
 * Search, filters, sort and page for the two catalog tabs, kept in the URL (?q=…&category=…),
 * so going back from a product page returns to the same view.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import type { ShopProduct } from '@/types'
import { isTakingRequests } from './preorderState'

export type Sort = 'default' | 'price_asc' | 'price_desc' | 'name'

/** The fields of a product or pre-order that the catalog filters on. */
export interface CatalogFields {
  name: string
  sku: string
  setCode: string
  category: string
  game: string
  price: number
}

export const PAGE_SIZE = 24

/**
 * Products shown on the Products tab: sold from stock. A product with nothing in stock that is
 * taking pre-order requests is on the Pre-orders tab instead. (Once requests close it is back here,
 * sold out, until stock arrives.)
 */
export const isStockProduct = (p: ShopProduct) =>
  !(p.activeRound && isTakingRequests(p.activeRound) && p.available === 0)

export function useCatalogParams() {
  const [params, setParams] = useSearchParams()

  /** Change some values; empty or "all" removes them. Any change but the page goes back to page 1. */
  const update = useCallback(
    (patch: Record<string, string | number | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === '' || v === 'all' || (k === 'page' && v === 1)) next.delete(k)
            else next.set(k, String(v))
          }
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  return {
    search: params.get('q') ?? '',
    category: params.get('category') ?? 'all',
    setCode: params.get('set') ?? 'all',
    sort: (params.get('sort') ?? 'default') as Sort,
    page: Math.max(1, Number(params.get('page')) || 1),
    /** Page-specific chip (in stock only, needs action, …). */
    show: params.get('show') ?? '',
    update,
  }
}

export type CatalogParams = ReturnType<typeof useCatalogParams>

/** Sorted distinct non-empty values, for a filter's options. */
export const optionsOf = <T>(items: T[], pick: (t: T) => string) =>
  [...new Set(items.map(pick).filter(Boolean))].sort((a, b) => a.localeCompare(b))

const SORTS: Record<Exclude<Sort, 'default'>, (a: CatalogFields, b: CatalogFields) => number> = {
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
}

/** Apply search, category and set, then sort ("default" keeps the API's order). */
export function filterCatalog<T>(items: T[], fields: (t: T) => CatalogFields, p: CatalogParams): T[] {
  const q = p.search.trim().toLowerCase()
  const rows = items.filter((item) => {
    const f = fields(item)
    return (
      (p.category === 'all' || f.category === p.category) &&
      (p.setCode === 'all' || f.setCode === p.setCode) &&
      (!q || [f.name, f.sku, f.setCode, f.category].some((v) => v.toLowerCase().includes(q)))
    )
  })
  if (p.sort === 'default' || !(p.sort in SORTS)) return rows
  const compare = SORTS[p.sort]
  return [...rows].sort((a, b) => compare(fields(a), fields(b)))
}
