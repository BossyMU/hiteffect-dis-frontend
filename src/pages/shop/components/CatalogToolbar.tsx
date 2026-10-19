import type { ReactNode } from 'react'
import { SearchInput, Select } from '@/components/ui'
import type { CatalogParams } from '../catalog'

interface CatalogToolbarProps {
  params: CatalogParams
  /** Category and set options; leave out (or pass one value) to hide that filter. */
  categories?: string[]
  sets?: string[]
  /** Label of the API's own order ("Newest first", "Needs action first"). */
  defaultSortLabel: string
  /** Page-specific chips, shown after the selects. */
  children?: ReactNode
}

/** Search, category and set (when given), and sort above a catalog grid. */
export function CatalogToolbar({
  params,
  categories = [],
  sets = [],
  defaultSortLabel,
  children,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        aria-label="Search"
        placeholder="Search name, code or set…"
        value={params.search}
        onChange={(e) => params.update({ q: e.target.value })}
        className="min-w-56 flex-1 sm:flex-none"
      />
      {categories.length > 1 && (
        <Select
          aria-label="Category"
          value={params.category}
          onChange={(e) => params.update({ category: e.target.value })}
          className="w-auto"
        >
          <option value="all">Any category</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      )}
      {sets.length > 1 && (
        <Select
          aria-label="Set"
          value={params.setCode}
          onChange={(e) => params.update({ set: e.target.value })}
          className="w-auto"
        >
          <option value="all">Any set</option>
          {sets.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      )}
      <Select
        aria-label="Sort"
        value={params.sort}
        onChange={(e) => params.update({ sort: e.target.value === 'default' ? null : e.target.value })}
        className="w-auto"
      >
        <option value="default">{defaultSortLabel}</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="name">Name A–Z</option>
      </Select>
      {children}
    </div>
  )
}
