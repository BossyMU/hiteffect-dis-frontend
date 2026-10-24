import type { RoundStatus, ShopRound } from '@/types'
import { boxes, formatDate, formatDeadline } from '@/utils/format'

/** What a pre-order means for this shop right now, for its card and its page. */
export interface PreorderState {
  /** Image badge. */
  badge: string
  badgeTone: 'dark' | 'muted' | 'primary' | 'success'
  /** One short line under the price. */
  line: string
  /** Card button. */
  action: string
  /** The card button is the orange call to action (request, accept, pay). */
  urgent: boolean
}

const request = (r: ShopRound) => (r.myPreorder?.status === 'submitted' ? r.myPreorder.requestedQty : null)

/**
 * Open and before its request deadline. Only these are on the Pre-orders tab; once requests close,
 * a pre-order is followed on My pre-orders. (The deadline job closes a round a few minutes after
 * its deadline, so the deadline is checked too.)
 */
export const isTakingRequests = (r: { status: RoundStatus; requestDeadline: string | null }) =>
  r.status === 'open' && (!r.requestDeadline || new Date(r.requestDeadline).getTime() > Date.now())

/** The shop has a request or an offer in this round. */
export const isMine = (r: ShopRound) => request(r) != null || r.myAllocation != null

export function preorderState(r: ShopRound): PreorderState {
  const asked = request(r)
  const offer = r.myAllocation
  const view = { action: 'View details', urgent: false }

  if (r.status === 'cancelled')
    return { badge: 'Cancelled', badgeTone: 'muted', line: 'Nothing to pay', ...view }

  if (r.status === 'open') {
    return asked == null
      ? {
          badge: 'Pre-order',
          badgeTone: 'dark',
          line: `Closes ${formatDate(r.requestDeadline)}`,
          action: 'Request boxes',
          urgent: true,
        }
      : {
          badge: 'Requested',
          badgeTone: 'success',
          line: `You asked for ${boxes(asked)}`,
          action: 'Change request',
          urgent: false,
        }
  }

  if (r.status === 'allocating') {
    return {
      badge: 'Requests closed',
      badgeTone: 'muted',
      line: asked != null ? `You asked for ${boxes(asked)} · offer coming` : 'You did not request',
      ...view,
    }
  }

  if (offer?.status === 'offered') {
    return {
      badge: 'Offer ready',
      badgeTone: 'primary',
      line: `${boxes(offer.offeredQty)} · accept by ${formatDate(offer.offerExpiresAt)}`,
      action: 'Accept offer',
      urgent: true,
    }
  }

  if (offer?.status === 'accepted') {
    const qty = boxes(offer.acceptedQty ?? offer.offeredQty)
    const order = { action: r.myOrderId ? 'View order' : 'View details', urgent: false }
    // The shop's own order says where it is; the round can be further along for other shops.
    const mine = r.myOrder
    if (mine?.paymentPending) {
      const what = mine.status === 'awaiting_deposit' ? 'deposit' : 'payment'
      return {
        badge: `Checking ${what}`,
        badgeTone: 'muted',
        line: `${qty} · we are checking your ${what}`,
        ...order,
      }
    }
    switch (mine?.status) {
      case 'awaiting_stock':
        return {
          badge: 'Deposit confirmed',
          badgeTone: 'success',
          line: r.expectedArrival ? `${qty} · arrives ~${formatDate(r.expectedArrival)}` : qty,
          ...order,
        }
      case 'pending_payment':
        return {
          badge: 'Balance due',
          badgeTone: 'primary',
          line: `${qty} · pay by ${formatDate(mine.paymentDueAt ?? r.paymentDeadline)}`,
          ...order,
        }
      case 'paid':
        return {
          badge: 'Payment confirmed',
          badgeTone: 'success',
          line: r.shipDate ? `${qty} · ships ~${formatDate(r.shipDate)}` : qty,
          ...order,
        }
      case 'shipped':
        return { badge: 'Shipped', badgeTone: 'muted', line: qty, ...order }
      case 'cancelled':
        return { badge: 'Cancelled', badgeTone: 'muted', line: 'Order cancelled', ...order }
    }
    if (r.status === 'balance_due') {
      return {
        badge: 'Balance due',
        badgeTone: 'primary',
        line: `${qty} · pay by ${formatDate(r.paymentDeadline)}`,
        ...order,
      }
    }
    if (r.status === 'closed') return { badge: 'Completed', badgeTone: 'muted', line: qty, ...order }
    return {
      badge: 'Accepted',
      badgeTone: 'success',
      line: r.expectedArrival ? `${qty} · arrives ~${formatDate(r.expectedArrival)}` : qty,
      ...order,
    }
  }

  const ended: Record<string, string> = {
    not_offered: 'No boxes for you this time',
    declined: 'You declined the offer',
    expired: 'Your offer expired',
  }
  return {
    badge: 'Requests closed',
    badgeTone: 'muted',
    line: (offer && ended[offer.status]) || 'You did not request',
    ...view,
  }
}

/** The deadline that matters next, for the pre-order page. */
export function nextDeadline(r: ShopRound) {
  if (r.status === 'open') return `Requests close ${formatDeadline(r.requestDeadline)}`
  if (r.myAllocation?.status === 'offered')
    return `Accept by ${formatDeadline(r.myAllocation.offerExpiresAt)}`
  const mine = r.myOrder
  if (mine?.status === 'pending_payment' && !mine.paymentPending)
    return `Balance due ${formatDeadline(mine.paymentDueAt ?? r.paymentDeadline)}`
  return null
}

// ─── My pre-orders ──────────────────────────────────────────────────────────

/** The steps every pre-order goes through, shown as a tracker on My pre-orders. */
export const TRACK_STEPS = [
  'Request',
  'Offer',
  'Pay deposit',
  'Deposit confirmed',
  'Stock arrives',
  'Pay balance',
  'Payment confirmed',
  'Shipped',
] as const

export type TrackStage = 'action' | 'progress' | 'done'

export interface TrackState {
  /** Needs the shop now, under way, or over (shipped, declined, cancelled, …). */
  stage: TrackStage
  /** Steps before this index are done. */
  current: number
  /** The pre-order ended at `current` without going further (declined, expired, cancelled). */
  stopped: boolean
  /** What is happening now, in a sentence. */
  next: string
  action: { label: string; to: 'preorder' | 'order'; urgent: boolean }
}

const confirmedOn = (order: { paymentConfirmedAt: string | null }) =>
  order.paymentConfirmedAt ? ` on ${formatDate(order.paymentConfirmedAt)}` : ''

/** Where a shop's pre-order is, from request to shipping, for the My pre-orders tab. */
export function trackState(r: ShopRound): TrackState {
  const asked = request(r)
  const offer = r.myAllocation
  const order = r.myOrder
  const view = { label: 'View pre-order', to: 'preorder', urgent: false } as const
  const viewOrder = { label: 'View order', to: 'order', urgent: false } as const

  if (r.status === 'cancelled') {
    return {
      stage: 'done',
      current: 1,
      stopped: true,
      next: 'This pre-order was cancelled. Nothing to pay.',
      action: view,
    }
  }

  if (order) {
    switch (order.status) {
      case 'cancelled':
        return {
          stage: 'done',
          current: order.paidAmount > 0 ? 5 : 2,
          stopped: true,
          next: `Order cancelled${order.cancelReason ? `: ${order.cancelReason}` : ''}.`,
          action: viewOrder,
        }
      case 'awaiting_deposit':
        return {
          stage: 'progress',
          current: order.paymentPending ? 3 : 2,
          stopped: false,
          next: order.paymentPending
            ? 'We received your deposit and are checking it. We will confirm it soon.'
            : 'Waiting for your deposit.',
          action: viewOrder,
        }
      case 'awaiting_stock':
        return {
          stage: 'progress',
          current: 4,
          stopped: false,
          next: `We confirmed your deposit${confirmedOn(order)}. Waiting for the stock${r.expectedArrival ? `, expected ${formatDate(r.expectedArrival)}` : ''}.`,
          action: viewOrder,
        }
      case 'pending_payment':
        return order.paymentPending
          ? {
              stage: 'progress',
              current: 6,
              stopped: false,
              next: 'We received your balance payment and are checking it. We will confirm it soon.',
              action: viewOrder,
            }
          : {
              stage: 'action',
              current: 5,
              stopped: false,
              next: `The stock has arrived. Pay the balance by ${formatDeadline(order.paymentDueAt ?? r.paymentDeadline)}.`,
              action: { label: 'Pay balance', to: 'order', urgent: true },
            }
      case 'paid':
        return {
          stage: 'progress',
          current: 7,
          stopped: false,
          next: `We confirmed your payment${confirmedOn(order)}. We ship ${r.shipDate ? `from ${formatDate(r.shipDate)}` : 'soon'}.`,
          action: viewOrder,
        }
      case 'shipped':
        return {
          stage: 'done',
          current: 8,
          stopped: false,
          next: `Shipped ${formatDate(order.shippedAt)}${order.trackingNo ? ` · tracking ${order.trackingNo}` : ''}.`,
          action: viewOrder,
        }
    }
  }

  if (offer?.status === 'offered') {
    return {
      stage: 'action',
      current: 1,
      stopped: false,
      next: `You are offered ${boxes(offer.offeredQty)}. Accept by ${formatDeadline(offer.offerExpiresAt)} with the ${r.depositPct}% deposit.`,
      action: { label: 'Accept offer', to: 'preorder', urgent: true },
    }
  }

  const ended: Record<string, string> = {
    not_offered: 'Demand was higher than our supply, so there were no boxes for you. Nothing to pay.',
    declined: 'You declined the offer.',
    expired: 'The offer expired before it was accepted.',
  }
  if (offer && ended[offer.status]) {
    return { stage: 'done', current: 1, stopped: true, next: ended[offer.status], action: view }
  }

  if (r.status === 'open') {
    return {
      stage: 'progress',
      current: 0,
      stopped: false,
      next: `You asked for ${boxes(asked ?? 0)}. You can change it until ${formatDeadline(r.requestDeadline)}.`,
      action: { label: 'Change request', to: 'preorder', urgent: false },
    }
  }

  return {
    stage: 'progress',
    current: 1,
    stopped: false,
    next: 'Requests are closed. We are sharing out the boxes and will notify you when your offer is ready.',
    action: view,
  }
}
