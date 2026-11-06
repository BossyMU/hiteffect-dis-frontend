import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { adminApi } from '@/api'
import {
  Badge,
  Button,
  DataTable,
  Field,
  FilterBar,
  FilterChip,
  LoadState,
  Modal,
  ModalActions,
  PageHeader,
  SearchInput,
  TableCell,
  TableRow,
  TextArea,
  TextInput,
} from '@/components/ui'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import { PATHS } from '@/routes/paths'
import type { NewProduct, Product, Tier } from '@/types'
import { csvToday, downloadCsv } from '@/utils/csv'
import { formatBaht, formatDateTime } from '@/utils/format'
import { formatWeight } from '@/utils/shipping'
import { GameFilterNote, GameFilterSelects } from './components/GameFilter'
import { useGameFilter } from './components/useGameFilter'

const CATEGORY_SUGGESTIONS = ['Booster Box', 'Decks', 'Box Set', 'Bundle', 'Accessories']

export default function ProductsPage() {
  const [archived, setArchived] = useState(false)
  const { data, setData, status, error, reload } = useApiData(() => adminApi.products(archived), [archived])
  const { data: tiers } = useApiData(() => adminApi.tiers())
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [adjusting, setAdjusting] = useState<Product | null>(null)
  const [limits, setLimits] = useState<Product | null>(null)

  const games = useGameFilter()
  const products = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (p) =>
        games.matches(p.game, p.category) &&
        (!q || [p.name, p.sku, p.setCode, p.game, p.category].some((v) => v.toLowerCase().includes(q))),
    )
  }, [data, search, games])

  const store = (p: Product) =>
    setData((prev) =>
      prev?.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...(prev ?? [])],
    )
  /** Deleted, archived or restored: it leaves the list being shown. */
  const drop = (id: string) => {
    setData((prev) => prev?.filter((x) => x.id !== id) ?? prev)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle="Counted in boxes. Available = on hand − held for orders."
        actions={
          <>
            <Button
              variant="outline"
              disabled={products.length === 0}
              onClick={() => exportProducts(products, tiers ?? [], archived)}
              title="The products shown with the filters below, with stock and prices"
            >
              Export CSV ({products.length})
            </Button>
            <Button onClick={() => setEditing('new')}>+ New product</Button>
          </>
        }
      />
      <FilterBar>
        <FilterChip active={!archived} onClick={() => setArchived(false)}>
          In use
        </FilterChip>
        <FilterChip active={archived} onClick={() => setArchived(true)}>
          Archived
        </FilterChip>
      </FilterBar>
      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by name, SKU or set…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <GameFilterSelects filter={games} />
      </div>
      <GameFilterNote filter={games} />
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Product', 'Base price', 'On hand', 'Held', 'Available', 'Shop', '']}
          isEmpty={products.length === 0}
          emptyMessage={
            games.active
              ? 'No products for this game or category.'
              : archived
                ? 'No archived products.'
                : 'No products yet.'
          }
        >
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <p className="font-medium">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.sku}
                  {p.setCode && ` · ${p.setCode}`}
                  {p.category && ` · ${p.category}`}
                  {p.tierPrices.length > 0 && ' · tier prices'}
                  {p.maxPerOrder != null && ` · limit ${p.maxPerOrder}/shop`}
                  {p.weightGrams ? (
                    ` · ${formatWeight(p.weightGrams)}/box`
                  ) : (
                    <span className="font-semibold text-danger"> · weight missing: edit to add it</span>
                  )}
                </p>
              </TableCell>
              <TableCell className="font-mono">{formatBaht(p.basePrice)}</TableCell>
              <TableCell className="font-mono">{p.stockOnHand}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{p.stockReserved}</TableCell>
              <TableCell className="font-mono font-semibold">{p.available}</TableCell>
              <TableCell>
                {p.archivedAt ? (
                  <Badge tone="neutral">Archived</Badge>
                ) : p.isListed ? (
                  <Badge tone="success">Listed</Badge>
                ) : (
                  <Badge tone="neutral">Hidden</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="soft" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setAdjusting(p)}>
                    Stock
                  </Button>
                  {p.maxPerOrder != null && (
                    <Button size="sm" variant="secondary" onClick={() => setLimits(p)}>
                      Limit
                      {p.shopsAtLimit > 0 && (
                        <span className="ml-1 rounded bg-warning/20 px-1 font-semibold text-warning">
                          {p.shopsAtLimit}
                        </span>
                      )}
                    </Button>
                  )}
                  <Link
                    to={PATHS.adminPreviewProduct(p.id)}
                    className="self-center px-1 text-sm font-semibold text-info hover:underline"
                  >
                    Preview
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </LoadState>
      {editing && (
        <ProductModal
          product={editing === 'new' ? null : editing}
          tiers={tiers ?? []}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            store(p)
            setEditing(null)
          }}
          onRemoved={drop}
        />
      )}
      {limits && (
        <LimitModal
          product={limits}
          onClose={() => {
            setLimits(null)
            void reload()
          }}
        />
      )}
      {adjusting && (
        <StockModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={(p) => {
            store(p)
            setAdjusting(null)
          }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  tiers,
  onClose,
  onSaved,
  onRemoved,
}: {
  product: Product | null
  tiers: Tier[]
  onClose: () => void
  onSaved: (p: Product) => void
  /** Deleted, archived or restored: no longer in the list being shown. */
  onRemoved: (id: string) => void
}) {
  const { run } = useToast()
  const { data: filters } = useApiData(() => adminApi.productFilters())
  const [form, setForm] = useState({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    game: product?.game ?? 'Flesh and Blood',
    setCode: product?.setCode ?? '',
    category: product?.category ?? '',
    description: product?.description ?? '',
    imageUrl: product?.imageUrl ?? '',
    boxesPerCase: product?.boxesPerCase != null ? String(product.boxesPerCase) : '',
    releaseDate: product?.releaseDate ?? '',
    basePrice: product ? String(product.basePrice) : '',
    maxPerOrder: product?.maxPerOrder != null ? String(product.maxPerOrder) : '',
    weightGrams: product?.weightGrams != null ? String(product.weightGrams) : '',
    isListed: product?.isListed ?? true,
  })
  const [tierPrices, setTierPrices] = useState<Record<number, string>>(
    Object.fromEntries((product?.tierPrices ?? []).map((t) => [t.tierId, String(t.price)])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  async function save() {
    const e: Record<string, string> = {}
    if (!form.sku.trim()) e.sku = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (!(Number(form.basePrice) >= 0) || form.basePrice === '') e.basePrice = 'Enter a price'
    if (form.imageUrl && !/^https?:\/\//.test(form.imageUrl)) e.imageUrl = 'A full https:// link'
    if (form.weightGrams.trim() === '') e.weightGrams = 'Required: the weight of one box, for EMS shipping'
    else if (!(Number(form.weightGrams) >= 1 && Number(form.weightGrams) <= 30000))
      e.weightGrams = 'Between 1 and 30,000 g'
    if (Object.keys(e).length) return setErrors(e)

    const optionalInt = (v: string) => (v.trim() === '' ? null : Math.max(1, Math.floor(Number(v))))
    const body: NewProduct = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      game: form.game.trim(),
      setCode: form.setCode.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      boxesPerCase: optionalInt(form.boxesPerCase),
      releaseDate: form.releaseDate || null,
      basePrice: Number(form.basePrice),
      maxPerOrder: optionalInt(form.maxPerOrder),
      weightGrams: Math.max(1, Math.floor(Number(form.weightGrams))),
      isListed: form.isListed,
      tierPrices: Object.entries(tierPrices)
        .filter(([, v]) => v.trim() !== '' && Number(v) >= 0)
        .map(([tierId, v]) => ({ tierId: Number(tierId), price: Number(v) })),
    }
    setBusy(true)
    let saved: Product | null = null
    const ok = await run(
      async () => {
        saved = product ? await adminApi.updateProduct(product.id, body) : await adminApi.createProduct(body)
      },
      product ? 'Product saved' : 'Product created',
    )
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title={product ? `Edit ${product.name}` : 'New product'}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          {product && <RemoveAction product={product} onDone={onRemoved} />}
          <ModalActions onCancel={onClose} onConfirm={() => void save()} confirmLabel="Save" busy={busy} />
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU" htmlFor="p-sku" error={errors.sku}>
          <TextInput
            id="p-sku"
            value={form.sku}
            onChange={(e) => set('sku')(e.target.value)}
            placeholder="FAB-OMN-BB"
          />
        </Field>
        <Field label="Base price per box (incl. VAT)" htmlFor="p-price" error={errors.basePrice}>
          <TextInput
            id="p-price"
            type="number"
            min={0}
            value={form.basePrice}
            onChange={(e) => set('basePrice')(e.target.value)}
          />
        </Field>
        <Field label="Name" htmlFor="p-name" error={errors.name} className="sm:col-span-2">
          <TextInput id="p-name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Field>
        <Field label="Game" htmlFor="p-game">
          <TextInput
            id="p-game"
            list="p-games"
            value={form.game}
            onChange={(e) => set('game')(e.target.value)}
          />
          <datalist id="p-games">
            {(filters?.games ?? []).map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="Set code" htmlFor="p-set">
          <TextInput id="p-set" value={form.setCode} onChange={(e) => set('setCode')(e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="p-category" hint="Shops filter by it">
          <TextInput
            id="p-category"
            list="p-categories"
            value={form.category}
            onChange={(e) => set('category')(e.target.value)}
            placeholder="Booster Box"
          />
          <datalist id="p-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Release date" htmlFor="p-release">
          <TextInput
            id="p-release"
            type="date"
            value={form.releaseDate}
            onChange={(e) => set('releaseDate')(e.target.value)}
          />
        </Field>
        <Field label="Boxes per case" htmlFor="p-case" hint="Display only">
          <TextInput
            id="p-case"
            type="number"
            min={1}
            value={form.boxesPerCase}
            onChange={(e) => set('boxesPerCase')(e.target.value)}
          />
        </Field>
        <Field
          label="Limit per shop"
          htmlFor="p-max"
          hint="Counts all of a shop's orders; then locked until you unlock it. Empty = no limit."
        >
          <TextInput
            id="p-max"
            type="number"
            min={1}
            value={form.maxPerOrder}
            onChange={(e) => set('maxPerOrder')(e.target.value)}
          />
        </Field>
        <Field
          label="Weight per box (grams) *"
          htmlFor="p-weight"
          error={errors.weightGrams}
          hint="For EMS shipping. Weigh one sealed box"
        >
          <TextInput
            id="p-weight"
            type="number"
            min={1}
            max={30000}
            value={form.weightGrams}
            onChange={(e) => set('weightGrams')(e.target.value)}
            placeholder="1000"
          />
        </Field>
        <Field label="Image link" htmlFor="p-image" error={errors.imageUrl} className="sm:col-span-2">
          <TextInput
            id="p-image"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl')(e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Description" htmlFor="p-desc" className="sm:col-span-2">
          <TextArea
            id="p-desc"
            rows={2}
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Price per tier (empty = base price)
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {tiers.map((t) => (
              <Field key={t.id} label={t.name} htmlFor={`tp-${t.id}`}>
                <TextInput
                  id={`tp-${t.id}`}
                  type="number"
                  min={0}
                  value={tierPrices[t.id] ?? ''}
                  placeholder={form.basePrice || '—'}
                  onChange={(e) => setTierPrices((tp) => ({ ...tp, [t.id]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isListed}
              onChange={(e) => set('isListed')(e.target.checked)}
            />
            List on the shops' Products page (regular orders)
          </label>
          <p className="mt-1 ml-6 text-xs text-muted-foreground">
            Untick for a pre-order-only product. Its pre-order rounds still show on the Pre-orders tab.
          </p>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Bottom-left of the product editor: Delete for a product nothing uses (created by mistake), Archive
 * for one with orders or rounds (its history stays), Restore for an archived one.
 */
function RemoveAction({ product, onDone }: { product: Product; onDone: (id: string) => void }) {
  const { run } = useToast()
  const [busy, setBusy] = useState(false)

  async function act(confirm: string, action: () => Promise<unknown>, success: string) {
    if (!window.confirm(confirm)) return
    setBusy(true)
    const ok = await run(action, success)
    setBusy(false)
    if (ok) onDone(product.id)
  }

  const className = 'mr-auto'
  if (product.archivedAt) {
    return (
      <Button
        variant="outline"
        className={className}
        disabled={busy}
        onClick={() =>
          void act(
            `Restore ${product.name}? It comes back to your product list${product.isListed ? ' and to shops' : ''}.`,
            () => adminApi.restoreProduct(product.id),
            'Product restored',
          )
        }
      >
        Restore
      </Button>
    )
  }
  if (product.hasHistory) {
    return (
      <Button
        variant="secondary"
        className={className}
        disabled={busy}
        onClick={() =>
          void act(
            `Archive ${product.name}?\n\nShops can no longer see or order it, and it leaves your product list and the list for new pre-order rounds. Its orders and history stay, and you can restore it from Archived.`,
            () => adminApi.archiveProduct(product.id),
            'Product archived',
          )
        }
      >
        Archive…
      </Button>
    )
  }
  return (
    <Button
      variant="destructive"
      className={className}
      disabled={busy}
      onClick={() =>
        void act(
          `Delete ${product.name} for good?\n\nIt has never been ordered or used in a pre-order round. This cannot be undone.`,
          () => adminApi.deleteProduct(product.id),
          'Product deleted',
        )
      }
    >
      Delete…
    </Button>
  )
}

/**
 * Who has ordered a limited product, and who has reached the limit (locked out of it). Unlock one
 * shop, or every shop at once (for example when a new batch arrives): its count starts again.
 */
function LimitModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { run } = useToast()
  const { data, setData, status, error, reload } = useApiData(
    () => adminApi.limitUsage(product.id),
    [product.id],
  )
  const [busy, setBusy] = useState(false)

  async function unlock(userId?: string, shopName?: string) {
    const confirm = userId
      ? `Unlock ${product.name} for ${shopName}? Its count starts again, so it can order up to ${product.maxPerOrder} more.`
      : `Unlock ${product.name} for every shop? Every count starts again, so each shop can order up to ${product.maxPerOrder} more.`
    if (!window.confirm(confirm)) return
    setBusy(true)
    await run(async () => setData(await adminApi.unlockLimit(product.id, userId)), 'Unlocked')
    setBusy(false)
  }

  return (
    <Modal
      title={`Limit: ${product.name}`}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <Button
            variant="outline"
            className="mr-auto"
            disabled={busy || !data?.shops.length}
            onClick={() => void unlock()}
          >
            Unlock everyone
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Each shop can order {product.maxPerOrder} of this product in total, across all its orders (cancelled
          ones don't count). A shop that reaches it can't order more until you unlock it.
        </p>
        <LoadState status={status} error={error} onRetry={reload}>
          <DataTable
            headers={['Shop', 'Ordered', '', '']}
            isEmpty={(data?.shops ?? []).length === 0}
            emptyMessage="No shop has ordered it since the last unlock."
          >
            {(data?.shops ?? []).map((s) => (
              <TableRow key={s.userId}>
                <TableCell>
                  <p className="font-medium">{s.shopName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{s.email}</p>
                </TableCell>
                <TableCell className="font-mono">
                  {s.ordered} / {data?.maxPerOrder}
                </TableCell>
                <TableCell>
                  {s.locked ? (
                    <Badge tone="warning">Locked</Badge>
                  ) : (
                    <Badge tone="neutral">Can order more</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={busy}
                    onClick={() => void unlock(s.userId, s.shopName)}
                  >
                    Unlock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </LoadState>
      </div>
    </Modal>
  )
}

function StockModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const { run } = useToast()
  const { data: movements } = useApiData(() => adminApi.movements(product.id), [product.id])
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    const n = Number(qty)
    if (!Number.isInteger(n) || n === 0) return setError('Enter boxes to add (e.g. 12) or remove (e.g. -2)')
    if (!note.trim()) return setError('Say why the stock changed')
    setBusy(true)
    let saved: Product | null = null
    const ok = await run(async () => {
      saved = await adminApi.adjustStock(product.id, n, note.trim())
    }, 'Stock updated')
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title={`Stock: ${product.name}`}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel="Update stock"
          busy={busy}
        />
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          On hand {product.stockOnHand} · held for orders {product.stockReserved} · available{' '}
          {product.available}. Use this for regular stock you receive and for count corrections. Pre-order
          stock is added when you mark a round as arrived.
        </p>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field label="Boxes (+/−)" htmlFor="s-qty">
            <TextInput
              id="s-qty"
              type="number"
              value={qty}
              onChange={(e) => {
                setQty(e.target.value)
                setError(null)
              }}
            />
          </Field>
          <Field label="Why" htmlFor="s-note" error={error}>
            <TextInput
              id="s-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setError(null)
              }}
              placeholder="e.g. Restock delivery, damaged box"
            />
          </Field>
        </div>
        {/* Every manual edit, newest first. Boxes held, released and shipped for orders are on the orders. */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Manual stock edits{movements && movements.length > 0 ? ` (${movements.length})` : ''}
          </h3>
          {movements && movements.length === 0 && (
            <p className="text-sm text-muted-foreground">No manual edits yet.</p>
          )}
          {movements && movements.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg">
              <DataTable headers={['When', 'Boxes', 'Why', 'By']}>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                    </TableCell>
                    <TableCell
                      className={`font-mono font-semibold ${m.qty > 0 ? 'text-success' : 'text-danger'}`}
                    >
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </TableCell>
                    <TableCell className="text-xs">{m.note || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.createdBy ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/** The products shown, with stock, limits and the price each tier pays. */
function exportProducts(products: Product[], tiers: Tier[], archived: boolean) {
  const sortedTiers = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder)
  const headers = [
    'SKU',
    'Name',
    'Game',
    'Category',
    'Set',
    'Release date',
    'Shop status',
    'On hand',
    'Held for orders',
    'Available',
    'Limit per shop',
    'Boxes per case',
    'Weight per box (g)',
    'Base price',
    ...sortedTiers.map((t) => `${t.name} price`),
  ]
  const rows = products.map((p) => [
    p.sku,
    p.name,
    p.game,
    p.category,
    p.setCode,
    p.releaseDate ?? '',
    p.archivedAt ? 'Archived' : p.isListed ? 'Listed' : 'Hidden',
    p.stockOnHand,
    p.stockReserved,
    p.available,
    p.maxPerOrder,
    p.boxesPerCase,
    p.weightGrams,
    p.basePrice,
    // A tier without its own price pays the base price.
    ...sortedTiers.map((t) => p.tierPrices.find((tp) => tp.tierId === t.id)?.price ?? p.basePrice),
  ])
  downloadCsv(`deckdrive-products${archived ? '-archived' : ''}-${csvToday()}.csv`, headers, rows)
}
