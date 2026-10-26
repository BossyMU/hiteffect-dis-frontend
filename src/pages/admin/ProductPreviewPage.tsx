import { type ReactNode, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { adminApi } from '@/api'
import { Badge, FilterChip, LoadState, PageHeader, Pagination, Select } from '@/components/ui'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { Product, Tier } from '@/types'
import { boxes, formatBaht } from '@/utils/format'
import { PAGE_SIZE, filterCatalog, optionsOf, useCatalogParams } from '../shop/catalog'
import { CatalogCard, CatalogGrid } from '../shop/components/CatalogCard'
import { CatalogToolbar } from '../shop/components/CatalogToolbar'
import { cardButton } from '../shop/components/cardButton'
import { Description, DetailLayout, ItemOverline, ProductFacts } from '../shop/components/DetailLayout'
import { ImageBadge, ProductImage } from '../shop/components/ProductImage'

/**
 * Admin: the catalog as shops see it, built from the same cards and product page as the shop's
 * Products tab. Pick a tier to see its prices. Hidden (unlisted) products are included with a
 * "Hidden" tag, so a product can be checked before it is listed. Nothing here can be ordered.
 */

/** A tier's price for a product: its own price for that tier, else the base price (as the API does). */
const priceFor = (p: Product, tierId: number | null) =>
  p.tierPrices.find((t) => t.tierId === tierId)?.price ?? p.basePrice

/** The tier picked in the URL (?tier=2), else the first tier. */
function usePreviewTier(tiers: Tier[] | null) {
  const [params, setParams] = useSearchParams()
  const sorted = [...(tiers ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const picked = sorted.find((t) => String(t.id) === params.get('tier')) ?? sorted[0] ?? null
  const pick = (id: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tier', id)
        return next
      },
      { replace: true },
    )
  return { tiers: sorted, tier: picked, pick }
}

function TierPicker({ preview }: { preview: ReturnType<typeof usePreviewTier> }) {
  if (preview.tiers.length === 0) return null
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Prices for</span>
      <Select
        aria-label="Tier"
        value={preview.tier ? String(preview.tier.id) : ''}
        onChange={(e) => preview.pick(e.target.value)}
        className="w-auto"
      >
        {preview.tiers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} tier
          </option>
        ))}
      </Select>
    </label>
  )
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <p role="note" className="rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
      {children}
    </p>
  )
}

/** /admin/preview and /admin/preview/:id */
export default function ProductPreviewPage() {
  const { id } = useParams()
  const products = useApiData(() => adminApi.products())
  const tiers = useApiData(() => adminApi.tiers())
  const preview = usePreviewTier(tiers.data)

  return (
    <LoadState status={products.status} error={products.error} onRetry={products.reload}>
      {id ? (
        <PreviewDetail product={(products.data ?? []).find((p) => p.id === id) ?? null} preview={preview} />
      ) : (
        <PreviewList products={products.data ?? []} preview={preview} />
      )}
    </LoadState>
  )
}

function PreviewList({
  products,
  preview,
}: {
  products: Product[]
  preview: ReturnType<typeof usePreviewTier>
}) {
  const params = useCatalogParams()
  const tierId = preview.tier?.id ?? null
  const showHidden = params.show !== 'listed'

  const visible = useMemo(() => products.filter((p) => showHidden || p.isListed), [products, showHidden])
  const filtered = useMemo(
    () => filterCatalog(visible, (p) => ({ ...p, price: priceFor(p, tierId) }), params),
    [visible, params, tierId],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(params.page, pages)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hiddenCount = products.filter((p) => !p.isListed).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product preview"
        subtitle="Your products as shops see them on their Products tab"
        actions={<TierPicker preview={preview} />}
      />
      <PreviewNotice>
        Preview only: nothing here can be ordered. Products tagged <strong>Hidden</strong> aren't listed, so
        shops can't see them yet. Edit or list products on{' '}
        <Link to={PATHS.adminProducts} className="font-semibold text-info hover:underline">
          Products
        </Link>
        .
      </PreviewNotice>

      <CatalogToolbar
        params={params}
        categories={optionsOf(visible, (p) => p.category)}
        sets={optionsOf(visible, (p) => p.setCode)}
        defaultSortLabel="Newest first"
      >
        {hiddenCount > 0 && (
          <FilterChip
            active={!showHidden}
            onClick={() => params.update({ show: showHidden ? 'listed' : null })}
          >
            Listed only
          </FilterChip>
        )}
      </CatalogToolbar>

      <p className="font-mono text-xs text-muted-foreground">
        {filtered.length} product{filtered.length === 1 ? '' : 's'} · {preview.tier?.name ?? ''} tier prices
        per box, before VAT
      </p>
      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No products yet.{' '}
          <Link to={PATHS.adminProducts} className="font-semibold text-info hover:underline">
            Add one on Products
          </Link>
          .
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No products match.</p>
      ) : (
        <CatalogGrid>
          {paged.map((p) => (
            <CatalogCard
              key={p.id}
              to={`${PATHS.adminPreviewProduct(p.id)}${tierId ? `?tier=${tierId}` : ''}`}
              image={
                <ProductImage src={p.imageUrl} alt={p.name} setCode={p.setCode} game={p.game} hoverZoom>
                  {!p.isListed ? (
                    <ImageBadge tone="dark">Hidden</ImageBadge>
                  ) : (
                    p.available === 0 && <ImageBadge tone="muted">Sold out</ImageBadge>
                  )}
                </ProductImage>
              }
              sku={p.sku}
              name={p.name}
              price={priceFor(p, tierId)}
              note={p.available === 0 ? 'Out of stock' : `${p.available} in stock`}
              action={
                <button type="button" disabled className={cardButton.disabled}>
                  {p.available === 0 ? 'Sold out' : 'Add to cart'}
                </button>
              }
            />
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
    </div>
  )
}

function PreviewDetail({
  product: p,
  preview,
}: {
  product: Product | null
  preview: ReturnType<typeof usePreviewTier>
}) {
  if (!p) {
    return (
      <div className="space-y-4">
        <Link to={PATHS.adminPreview} className="text-sm text-info hover:underline">
          ← Product preview
        </Link>
        <p className="text-sm text-muted-foreground">This product doesn't exist.</p>
      </div>
    )
  }
  const soldOut = p.available === 0
  const tierName = preview.tier?.name ?? 'your'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">Preview</Badge>
          {p.isListed ? (
            <Badge tone="success">Listed</Badge>
          ) : (
            <Badge tone="neutral">Hidden: shops can't see it</Badge>
          )}
        </div>
        <TierPicker preview={preview} />
      </div>

      <DetailLayout
        backTo={PATHS.adminPreview}
        backLabel="Product preview"
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
          <p className="font-mono text-2xl font-semibold">
            {formatBaht(priceFor(p, preview.tier?.id ?? null))}
          </p>
          <p className="text-xs text-muted-foreground">Per box, before VAT · {tierName} tier price</p>
        </div>

        <p className={soldOut ? 'text-sm text-muted-foreground' : 'text-sm font-medium text-success'}>
          {soldOut ? 'Sold out' : `In stock: ${boxes(p.available)}`}
          {p.maxPerOrder != null && !soldOut && (
            <span className="font-normal text-muted-foreground"> · up to {p.maxPerOrder} per order</span>
          )}
        </p>

        <div className="space-y-2">
          <button type="button" disabled className={cardButton.disabled}>
            {soldOut ? 'Sold out' : 'Add to cart (preview)'}
          </button>
          <p className="text-xs text-muted-foreground">
            Boxes are held for you once you place the order. Pay by 23:59 today (Bangkok time), or the order
            is cancelled.
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

        <p className="text-sm">
          <Link to={PATHS.adminProducts} className="font-semibold text-info hover:underline">
            Edit this product on Products →
          </Link>
        </p>
      </DetailLayout>
    </div>
  )
}
