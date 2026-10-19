import { PATHS } from '@/routes/paths'
import type { Role } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: string
  /** Match only this exact path (for the home links). */
  end?: boolean
  /** Other pages that also highlight this item (the catalog tabs under Products). */
  also?: string[]
}

/**
 * Whether a nav item is the current section: its own path or one of its `also` paths. A page
 * opened from a list (with `from` in its location state) belongs to that list's section, so a
 * pre-order opened from My pre-orders highlights My pre-orders, not Products.
 */
export function isNavActive(item: NavItem, pathname: string, from?: string) {
  const path = (from ?? pathname).split('?')[0]
  const matches = (p: string) => path === p || path.startsWith(`${p}/`)
  return item.end ? path === item.to : matches(item.to) || (item.also ?? []).some(matches)
}

/** Primary navigation per role, in display order (sidebar and mobile bottom bar). */
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  shop: [
    { to: PATHS.home, label: 'Home', icon: '⌂', end: true },
    // Products, Pre-orders and the cart are tabs of one catalog.
    { to: PATHS.products, label: 'Products', icon: '▦', also: [PATHS.preorders, PATHS.cart] },
    { to: PATHS.myPreorders, label: 'My pre-orders', icon: '◈' },
    { to: PATHS.orders, label: 'Orders', icon: '◻' },
    { to: PATHS.profile, label: 'Profile', icon: '◎' },
  ],
  admin: [
    { to: PATHS.admin, label: 'Dashboard', icon: '⌂', end: true },
    { to: PATHS.adminRounds, label: 'Rounds', icon: '◈' },
    { to: PATHS.adminPayments, label: 'Payments', icon: '✓' },
    { to: PATHS.adminOrders, label: 'Orders', icon: '◻' },
    { to: PATHS.adminProducts, label: 'Products', icon: '▦' },
    { to: PATHS.adminShops, label: 'Shops', icon: '◎' },
  ],
}
