import { Link, NavLink, useLocation } from 'react-router'
import { useAuth, useUser } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { BrandMark } from './BrandMark'
import { NAV_ITEMS, isNavActive } from './navItems'

/** Fixed-width left navigation. `onNavigate` lets the mobile drawer close itself. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useUser()
  const { logout } = useAuth()
  const { pathname, state } = useLocation()
  const from = (state as { from?: string } | null)?.from
  const home = user.role === 'admin' ? PATHS.admin : PATHS.home

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <Link
        to={home}
        onClick={onNavigate}
        className="flex flex-col gap-1 border-b border-sidebar-border px-5 py-4 transition-opacity hover:opacity-80"
      >
        <BrandMark />
        <p className="font-mono text-[10.5px] tracking-[2px] text-muted-foreground uppercase">
          {user.role === 'admin' ? 'Distributor admin' : 'Distributor portal'}
        </p>
      </Link>

      <nav className="flex-1 space-y-1 px-3 pt-4" aria-label="Main">
        {NAV_ITEMS[user.role].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={() =>
              cn(
                'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                isNavActive(item, pathname, from)
                  ? 'border-ring bg-ring/5 font-semibold text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            <span className="w-4 text-center text-base text-primary" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.shopName || user.email}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {user.role === 'admin' ? 'Admin' : `${user.tierName ?? 'No'} tier`} · {user.email}
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          {user.role === 'admin' && (
            <Link to={PATHS.profile} onClick={onNavigate} className="text-info hover:underline">
              Profile
            </Link>
          )}
          <button type="button" onClick={logout} className="text-info hover:underline">
            Log out
          </button>
        </div>
      </div>
    </aside>
  )
}
