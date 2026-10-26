import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { adminApi } from '@/api'
import {
  Badge,
  Button,
  DataTable,
  Field,
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
import { formatBaht, formatDateTime } from '@/utils/format'
import { formatWeight } from '@/utils/shipping'

const CATEGORY_SUGGESTIONS = ['Booster Box', 'Decks', 'Box Set', 'Bundle', 'Accessories']

export default function ProductsPage() {
  const { data, setData, status, error, reload } = useApiData(() => adminApi.products())
  const { data: tiers } = useApiData(() => adminApi.tiers())
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [adjusting, setAdjusting] = useState<Product | null>(null)

  const products = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (p) => !q || [p.name, p.sku, p.setCode, p.game, p.category].some((v) => v.toLowerCase().includes(q)),
    )
  }, [data, search])

  const store = (p: Product) =>
    setData((prev) =>
      prev?.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...(prev ?? [])],
    )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        subtitle="Counted in boxes. Available = on hand − held for orders."
        actions={<Button onClick={() => setEditing('new')}>+ New product</Button>}
      />
      <SearchInput
        placeholder="Search by name, SKU or set…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Product', 'Base price', 'On hand', 'Held', 'Available', 'Shop', '']}
          isEmpty={products.length === 0}
          emptyMessage="No products yet."
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
                  {p.weightGrams ? ` · ${formatWeight(p.weightGrams)}/box` : ' · weight not set'}
                </p>
              </TableCell>
              <TableCell className="font-mono">{formatBaht(p.basePrice)}</TableCell>
              <TableCell className="font-mono">{p.stockOnHand}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{p.stockReserved}</TableCell>
              <TableCell className="font-mono font-semibold">{p.available}</TableCell>
              <TableCell>
                {p.isListed ? <Badge tone="success">Listed</Badge> : <Badge tone="neutral">Hidden</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="soft" onClick={() => setEditing(p)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setAdjusting(p)}>
                    Stock
                  </Button>
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
}: {
  product: Product | null
  tiers: Tier[]
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const { run } = useToast()
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
    if (
      form.weightGrams.trim() !== '' &&
      !(Number(form.weightGrams) >= 1 && Number(form.weightGrams) <= 30000)
    )
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
      weightGrams: optionalInt(form.weightGrams),
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
        <ModalActions onCancel={onClose} onConfirm={() => void save()} confirmLabel="Save" busy={busy} />
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
        <Field label="Base price per box (before VAT)" htmlFor="p-price" error={errors.basePrice}>
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
          <TextInput id="p-game" value={form.game} onChange={(e) => set('game')(e.target.value)} />
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
        <Field label="Max per regular order" htmlFor="p-max" hint="Empty = no limit">
          <TextInput
            id="p-max"
            type="number"
            min={1}
            value={form.maxPerOrder}
            onChange={(e) => set('maxPerOrder')(e.target.value)}
          />
        </Field>
        <Field
          label="Weight per box (grams)"
          htmlFor="p-weight"
          error={errors.weightGrams}
          hint="For EMS shipping. Empty = 1 kg"
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
        {movements && movements.length > 0 && (
          <DataTable headers={['When', 'Type', 'Boxes', 'Note']}>
            {movements.slice(0, 15).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(m.createdAt)}
                </TableCell>
                <TableCell className="text-xs">{m.type}</TableCell>
                <TableCell className="font-mono">{m.qty}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.note || m.refType || '—'}</TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </div>
    </Modal>
  )
}
