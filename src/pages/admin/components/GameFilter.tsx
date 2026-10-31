import { adminApi } from '@/api'
import { Select } from '@/components/ui'
import { useApiData } from '@/hooks/useApiData'
import { norm, type GameFilter } from './useGameFilter'

/** "Any game" and "Any category" dropdowns. `onChange` runs after a change (e.g. back to page 1). */
export function GameFilterSelects({ filter, onChange }: { filter: GameFilter; onChange?: () => void }) {
  const { data } = useApiData(() => adminApi.productFilters())
  const options = (values: string[] = [], current: string) => {
    // Show the current choice by its usual spelling; keep it even if no product uses it any more.
    const match = values.find((v) => norm(v) === norm(current))
    return { list: current && !match ? [...values, current] : values, value: match ?? current }
  }
  const games = options(data?.games, filter.game)
  const categories = options(data?.categories, filter.category)
  return (
    <>
      <Select
        aria-label="Game"
        value={games.value}
        onChange={(e) => {
          filter.set({ game: e.target.value })
          onChange?.()
        }}
        className="w-auto max-w-56"
      >
        <option value="">Any game</option>
        {games.list.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </Select>
      <Select
        aria-label="Category"
        value={categories.value}
        onChange={(e) => {
          filter.set({ category: e.target.value })
          onChange?.()
        }}
        className="w-auto max-w-56"
      >
        <option value="">Any category</option>
        {categories.list.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </Select>
    </>
  )
}

/** "Showing only Flesh and Blood · Booster Box  Clear", while a game or category is chosen. */
export function GameFilterNote({ filter, onChange }: { filter: GameFilter; onChange?: () => void }) {
  if (!filter.active) return null
  return (
    <p className="flex flex-wrap items-center gap-x-2 rounded-md border border-ring/40 bg-ring/5 px-3 py-2 text-sm">
      <span className="text-muted-foreground">Showing only</span>
      <span className="font-semibold">{[filter.game, filter.category].filter(Boolean).join(' · ')}</span>
      <button
        type="button"
        onClick={() => {
          filter.clear()
          onChange?.()
        }}
        className="font-semibold text-info hover:underline"
      >
        Clear
      </button>
    </p>
  )
}
