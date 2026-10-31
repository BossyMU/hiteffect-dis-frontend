import { useMemo, useState } from 'react'
import { adminApi } from '@/api'
import {
  Button,
  Card,
  DataTable,
  DetailList,
  Field,
  FilterBar,
  FilterChip,
  LoadState,
  Modal,
  ModalActions,
  PageHeader,
  SearchInput,
  SectionTitle,
  Select,
  TableCell,
  TableRow,
  TextInput,
  UserStatusBadge,
} from '@/components/ui'
import { USER_STATUS } from '@/constants/status'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import type { Tier, User, UserStatus } from '@/types'
import { formatDate } from '@/utils/format'

export default function ShopsPage() {
  const { data, setData, status, error, reload } = useApiData(() => adminApi.shops())
  const tiersData = useApiData(() => adminApi.tiers())
  const [filter, setFilter] = useState<UserStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [editingTier, setEditingTier] = useState<Tier | 'new' | null>(null)
  const shops = useMemo(() => data ?? [], [data])
  const tiers = tiersData.data ?? []

  const shown = shops.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      (!search.trim() || `${s.shopName} ${s.email}`.toLowerCase().includes(search.trim().toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Shops" subtitle="Approve sign-ups, set tiers and the purchase history bonus" />

      <FilterBar>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All <span className="ml-1 opacity-60">{shops.length}</span>
        </FilterChip>
        {(['pending', 'approved', 'suspended'] as const).map((s) => (
          <FilterChip key={s} tone={USER_STATUS[s].tone} active={filter === s} onClick={() => setFilter(s)}>
            {USER_STATUS[s].label}{' '}
            <span className="ml-1 opacity-60">{shops.filter((x) => x.status === s).length}</span>
          </FilterChip>
        ))}
      </FilterBar>
      <SearchInput
        placeholder="Search shop name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={[
            'Shop',
            'Status',
            'Shop tier',
            'Tier by game',
            'History bonus',
            'Expired offers',
            'Joined',
            '',
          ]}
          isEmpty={shown.length === 0}
          emptyMessage="No shops here."
        >
          {shown.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <p className="font-medium">{s.shopName}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.email}</p>
              </TableCell>
              <TableCell>
                <UserStatusBadge status={s.status} />
              </TableCell>
              <TableCell className="text-sm">{s.tierName ?? '—'}</TableCell>
              <TableCell className="text-xs">
                {(s.gameTiers ?? []).length === 0 ? (
                  <span className="text-muted-foreground">{s.startingTierName ?? '—'} in every game</span>
                ) : (
                  <>
                    {(s.gameTiers ?? []).map((g) => (
                      <p key={g.game}>
                        {g.game || 'No game'}: <span className="font-semibold">{g.tierName}</span>
                      </p>
                    ))}
                    <p className="text-muted-foreground">Others: {s.startingTierName}</p>
                  </>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">×{s.historyFactor.toFixed(2)}</TableCell>
              <TableCell className="font-mono text-sm">{s.expiredOffers}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatDate(s.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={s.status === 'pending' ? 'primary' : 'soft'}
                  onClick={() => setEditing(s)}
                >
                  {s.status === 'pending' ? 'Review' : 'Edit'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </LoadState>

      <Card className="space-y-4">
        <SectionTitle
          actions={
            <Button size="sm" variant="soft" onClick={() => setEditingTier('new')}>
              + Tier
            </Button>
          }
        >
          Tiers
        </SectionTitle>
        <p className="text-sm text-muted-foreground">
          Each shop has a tier per game (in a game new to it, the lowest tier). Its tier in a product's game
          sets its price, and its weight in that game's rounds: tier weight × history bonus, so a higher
          weight means a bigger share when supply is short. The optional limit caps how many boxes one shop
          can request per round. The shop tier is only a label on the shop's account.
        </p>
        <DataTable headers={['Tier', 'Weight', 'Request limit', 'Active shops', '']}>
          {tiers.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.name}</TableCell>
              <TableCell className="font-mono">×{t.weight}</TableCell>
              <TableCell className="font-mono">{t.maxPreorderQty ?? 'No limit'}</TableCell>
              <TableCell className="font-mono">{t.shopCount}</TableCell>
              <TableCell>
                <Button size="sm" variant="soft" onClick={() => setEditingTier(t)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </Card>

      {editing && (
        <ShopModal
          shop={editing}
          tiers={tiers}
          onClose={() => setEditing(null)}
          onSaved={(u) => {
            setData((prev) => (prev ?? []).map((x) => (x.id === u.id ? u : x)))
            setEditing(null)
            void tiersData.reload()
          }}
        />
      )}
      {editingTier && (
        <TierModal
          tier={editingTier === 'new' ? null : editingTier}
          onClose={() => setEditingTier(null)}
          onSaved={() => {
            setEditingTier(null)
            void tiersData.reload()
            void reload()
          }}
        />
      )}
    </div>
  )
}

function ShopModal({
  shop,
  tiers,
  onClose,
  onSaved,
}: {
  shop: User
  tiers: Tier[]
  onClose: () => void
  onSaved: (u: User) => void
}) {
  const { run } = useToast()
  const [status, setStatus] = useState<UserStatus>(shop.status === 'pending' ? 'approved' : shop.status)
  const [tierId, setTierId] = useState(shop.tierId ? String(shop.tierId) : '')
  const [factor, setFactor] = useState(shop.historyFactor.toFixed(2))
  const { data: filters } = useApiData(() => adminApi.productFilters())
  const lowest = [...tiers].sort((a, b) => a.weight - b.weight || a.sortOrder - b.sortOrder || a.id - b.id)[0]
  const key = (g: string) => g.trim().replace(/\s+/g, ' ').toLowerCase()
  const [byGame, setByGame] = useState<Record<string, { game: string; tierId: number }>>(() =>
    Object.fromEntries((shop.gameTiers ?? []).map((g) => [key(g.game), { game: g.game, tierId: g.tierId }])),
  )
  // Every game we sell, plus any the shop has a tier for that no product uses any more.
  const games = [
    ...new Map(
      [...(filters?.games ?? []), ...(shop.gameTiers ?? []).map((g) => g.game)].map(
        (g) => [key(g), g] as const,
      ),
    ).values(),
  ].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    const f = Number(factor)
    if (status === 'approved' && !tierId) return setError('Pick a shop tier before approving')
    if (!(f >= 1 && f <= 1.5)) return setError('The history bonus is between 1.00 and 1.50')
    setBusy(true)
    let saved: User | null = null
    const ok = await run(
      async () => {
        saved = await adminApi.updateShop(shop.id, {
          status,
          tierId: tierId ? Number(tierId) : null,
          historyFactor: f,
          gameTiers: Object.values(byGame),
        })
      },
      status === 'approved' && shop.status === 'pending' ? `${shop.shopName} approved` : 'Shop saved',
    )
    setBusy(false)
    if (ok && saved) onSaved(saved)
  }

  return (
    <Modal
      title={shop.shopName}
      onClose={onClose}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void save()}
          confirmLabel={shop.status === 'pending' ? 'Save' : 'Save'}
          busy={busy}
        />
      }
    >
      <div className="space-y-5">
        <DetailList
          items={[
            ['Email', shop.email],
            ['Contact', `${shop.contactName || '—'} · ${shop.phone || '—'}`],
            ['Address', shop.address || '—'],
            ['Tax ID', shop.taxId || '—'],
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Account" htmlFor="shop-status">
            <Select
              id="shop-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as UserStatus)
                setError(null)
              }}
            >
              <option value="pending">Waiting for approval</option>
              <option value="approved">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
          <Field label="Shop tier" htmlFor="shop-tier" hint="A label on the account">
            <Select
              id="shop-tier"
              value={tierId}
              onChange={(e) => {
                setTierId(e.target.value)
                setError(null)
              }}
            >
              <option value="">No tier</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="History bonus" htmlFor="shop-factor" hint="1.00 – 1.50">
            <TextInput
              id="shop-factor"
              type="number"
              step="0.05"
              min={1}
              max={1.5}
              value={factor}
              onChange={(e) => {
                setFactor(e.target.value)
                setError(null)
              }}
            />
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Tier by game</p>
          <p className="text-xs text-muted-foreground">
            Sets the shop's price, request limit and share in each game. A game new to the shop starts at{' '}
            {lowest?.name ?? 'the lowest tier'}.
          </p>
          {games.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products with a game yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {games.map((game) => {
                const current = byGame[key(game)]?.tierId ?? lowest?.id
                return (
                  <div key={key(game)} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm">{game || 'Products with no game'}</span>
                    <Select
                      aria-label={`Tier in ${game || 'products with no game'}`}
                      value={current ?? ''}
                      onChange={(e) =>
                        setByGame((m) => ({ ...m, [key(game)]: { game, tierId: Number(e.target.value) } }))
                      }
                      className="w-auto"
                    >
                      {tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.id === lowest?.id ? ' (starting tier)' : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {shop.status === 'pending' && (
          <p className="text-xs text-muted-foreground">The shop is notified when it is approved.</p>
        )}
      </div>
    </Modal>
  )
}

function TierModal({
  tier,
  onClose,
  onSaved,
}: {
  tier: Tier | null
  onClose: () => void
  onSaved: () => void
}) {
  const { run } = useToast()
  const [name, setName] = useState(tier?.name ?? '')
  const [weight, setWeight] = useState(String(tier?.weight ?? 1))
  const [limit, setLimit] = useState(tier?.maxPreorderQty != null ? String(tier.maxPreorderQty) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return setError('Name the tier')
    if (!(Number(weight) > 0)) return setError('The weight must be more than 0')
    if (limit && !(Number.isInteger(Number(limit)) && Number(limit) > 0))
      return setError('The limit is a whole number of boxes')
    const body = { name: name.trim(), weight: Number(weight), maxPreorderQty: limit ? Number(limit) : null }
    setBusy(true)
    const ok = await run(
      () => (tier ? adminApi.updateTier(tier.id, body) : adminApi.createTier({ ...body, sortOrder: 99 })),
      'Tier saved',
    )
    setBusy(false)
    if (ok) onSaved()
  }

  return (
    <Modal
      title={tier ? `Edit ${tier.name}` : 'New tier'}
      onClose={onClose}
      footer={
        <ModalActions onCancel={onClose} onConfirm={() => void save()} confirmLabel="Save" busy={busy} />
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" htmlFor="t-name">
          <TextInput
            id="t-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </Field>
        <Field label="Weight" htmlFor="t-weight">
          <TextInput
            id="t-weight"
            type="number"
            step="0.5"
            min={0.5}
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value)
              setError(null)
            }}
          />
        </Field>
        <Field label="Request limit" htmlFor="t-limit" hint="Empty = no limit">
          <TextInput
            id="t-limit"
            type="number"
            min={1}
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value)
              setError(null)
            }}
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Modal>
  )
}
