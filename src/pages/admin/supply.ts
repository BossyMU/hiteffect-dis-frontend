import type { AdminRound } from '@/types'

/** One filled part of the supply bar. What isn't filled is what's left. */
export interface SupplyPart {
  key: 'accepted' | 'waiting' | 'planned' | 'requested'
  label: string
  qty: number
}

export interface SupplyView {
  /** Boxes in the round: what arrived once the stock is in, the expected supply before that. */
  supply: number
  parts: SupplyPart[]
  /** Boxes not taken (never below 0). */
  left: number
  /** What "left" means at this stage. */
  leftLabel: string
  /** Requests above the supply, while requests are open. */
  over: number
}

/**
 * How much of a round's supply is still free, by stage:
 *   open        boxes nobody has requested yet (or how far requests go over the supply)
 *   allocating  boxes in no planned offer
 *   offering    boxes neither accepted nor waiting on a shop's answer (not offered, declined, expired)
 *   later       boxes no shop took; they become regular stock when the stock arrives
 */
export function supplyView(r: AdminRound): SupplyView | null {
  const supply = r.receivedQty ?? r.totalSupply
  if (supply == null) return null
  const s = r.stats
  let parts: SupplyPart[]
  let leftLabel: string
  switch (r.status) {
    case 'draft':
    case 'open':
    case 'cancelled':
      parts = [{ key: 'requested', label: 'Requested', qty: s.requestedTotal }]
      leftLabel = 'not requested yet'
      break
    case 'allocating':
      parts = [{ key: 'planned', label: 'In planned offers', qty: s.plannedTotal }]
      leftLabel = 'not in any offer'
      break
    case 'offering':
      parts = [
        { key: 'accepted', label: 'Accepted', qty: s.acceptedTotal },
        { key: 'waiting', label: 'Waiting for an answer', qty: s.waitingTotal },
      ]
      leftLabel = 'free: not offered, declined or expired'
      break
    default:
      parts = [{ key: 'accepted', label: 'Accepted', qty: s.acceptedTotal }]
      leftLabel = r.receivedQty != null ? 'not taken; regular stock' : 'not taken; becomes regular stock'
  }
  const used = parts.reduce((sum, p) => sum + p.qty, 0)
  return { supply, parts, left: Math.max(0, supply - used), leftLabel, over: Math.max(0, used - supply) }
}
