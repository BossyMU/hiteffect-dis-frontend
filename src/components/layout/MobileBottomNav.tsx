import { NavLink, useLocation } from 'react-router'
import { useUser } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import { NAV_ITEMS, isNavActive } from './navItems'

export function MobileBottomNav() {
  const user = useUser()
  const { pathname, state } = useLocation()
  const from = (state as { from?: string } | null)?.from
  return (
    <nav className="flex shrink-0 border-t border-sidebar-border bg-sidebar md:hidden" aria-label="Main">
      {NAV_ITEMS[user.role].slice(0, 5).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={() =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isNavActive(item, pathname, from) ? 'text-primary-strong' : 'text-muted-foreground',
            )
          }
        >
          <span className="text-lg leading-none" aria-hidden>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
