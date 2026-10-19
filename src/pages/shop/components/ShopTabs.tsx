import { NavLink } from 'react-router'
import { useCart } from '@/context/CartContext'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'

const TABS = [
  { to: PATHS.products, label: 'Products' },
  { to: PATHS.preorders, label: 'Pre-orders' },
]

const tab = (isActive: boolean) =>
  cn(
    '-mb-px flex items-center gap-2 border-b-2 px-2 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors sm:px-4 sm:text-sm',
    isActive
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )

/**
 * "Products | Pre-orders" tabs across the top of the catalog pages, with the cart
 * on the right. A tab stays active on its detail pages (/products/:id, /preorders/:id). On a narrow
 * screen the row scrolls sideways rather than wrapping.
 */
export function ShopTabs() {
  const { count } = useCart()
  return (
    <nav
      aria-label="Catalog"
      className="flex items-end justify-between gap-2 overflow-x-auto border-b border-border [scrollbar-width:none]"
    >
      <div className="flex">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => tab(isActive)}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <NavLink to={PATHS.cart} className={({ isActive }) => tab(isActive)}>
        Cart
        <span
          className={cn(
            'min-w-6 rounded-full px-1.5 py-0.5 text-center font-mono text-[11px]',
            count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
          aria-label={`${count} boxes in cart`}
        >
          {count}
        </span>
      </NavLink>
    </nav>
  )
}
