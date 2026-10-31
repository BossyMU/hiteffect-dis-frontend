import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filter admin lists (orders, rounds, payments, products) by game and category.
 *
 * The choice is in the address (?game=…&category=…) and remembered in this browser, so it carries
 * over as you move between admin pages from the sidebar, until you clear it. Spellings that differ
 * only in upper/lower case or spaces match.
 */
const STORE_KEY = 'deckdrive-admin-filter'
export const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

interface Choice {
  game: string
  category: string
}

function readStored(): Choice {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
    return { game: String(v.game ?? ''), category: String(v.category ?? '') }
  } catch {
    return { game: '', category: '' }
  }
}

function store(choice: Choice) {
  try {
    if (choice.game || choice.category) localStorage.setItem(STORE_KEY, JSON.stringify(choice))
    else localStorage.removeItem(STORE_KEY)
  } catch {
    // Storage blocked (private window): the address still holds the choice.
  }
}

export interface GameFilter extends Choice {
  active: boolean
  /** Does a row with this game (or these games) and category (or categories) pass? */
  matches: (games: string | string[], categories: string | string[]) => boolean
  set: (patch: Partial<Choice>) => void
  clear: () => void
}

export function useGameFilter(): GameFilter {
  const [params, setParams] = useSearchParams()
  const [stored, setStored] = useState(readStored)
  const game = params.get('game') ?? stored.game
  const category = params.get('category') ?? stored.category

  const set = useCallback(
    (patch: Partial<Choice>) => {
      const next = { game, category, ...patch }
      store(next)
      setStored(next)
      setParams(
        (prev) => {
          const url = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(next)) {
            if (v) url.set(k, v)
            else url.delete(k)
          }
          return url
        },
        { replace: true },
      )
    },
    [game, category, setParams],
  )

  const matches = useCallback(
    (games: string | string[], categories: string | string[]) => {
      const has = (values: string | string[], wanted: string) =>
        !wanted || (Array.isArray(values) ? values : [values]).some((v) => norm(v ?? '') === norm(wanted))
      return has(games, game) && has(categories, category)
    },
    [game, category],
  )

  return {
    game,
    category,
    active: Boolean(game || category),
    matches,
    set,
    clear: () => set({ game: '', category: '' }),
  }
}
