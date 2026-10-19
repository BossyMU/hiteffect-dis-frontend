import { Navigate, Outlet, useLocation } from 'react-router'
import { StatusPanel } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'
import type { Role } from '@/types'

/** Renders the nested routes only for a logged-in user with one of `roles`. */
export function RequireAuth({ roles }: { roles: Role[] }) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <StatusPanel title="Loading…" />
  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role))
    return <Navigate to={user.role === 'admin' ? PATHS.admin : PATHS.home} replace />
  return <Outlet />
}

/** Login and sign-up pages: send logged-in users to their home page. */
export function GuestOnly() {
  const { user, status } = useAuth()
  if (status === 'loading') return <StatusPanel title="Loading…" />
  if (user) return <Navigate to={user.role === 'admin' ? PATHS.admin : PATHS.home} replace />
  return <Outlet />
}
