import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, errorMessage, tokenStore, type RegisterInput } from '@/api'
import { setUnauthorizedHandler } from '@/api/client'
import type { User } from '@/types'

type AuthStatus = 'loading' | 'signed-in' | 'signed-out'

/**
 * The logged-in account. The token is kept in localStorage; on start the app checks it with GET /me.
 * Any API call that comes back 401 logs the user out and returns to the login screen.
 */
interface Auth {
  user: User | null
  status: AuthStatus
  /** Resolves to an error message, or null on success. */
  login: (email: string, password: string) => Promise<string | null>
  register: (input: RegisterInput) => Promise<string | null>
  logout: () => void
  /** Store an updated copy of the user (after editing the profile). */
  setUser: (user: User) => void
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.get() ? 'loading' : 'signed-out'))

  const logout = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
    setStatus('signed-out')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!tokenStore.get()) return
    authApi.me().then(
      (me) => {
        setUser(me)
        setStatus('signed-in')
      },
      () => logout(),
    )
  }, [logout])

  const value = useMemo<Auth>(
    () => ({
      user,
      status,
      logout,
      setUser,
      login: async (email, password) => {
        try {
          const { token, user: me } = await authApi.login(email, password)
          tokenStore.set(token)
          setUser(me)
          setStatus('signed-in')
          return null
        } catch (err) {
          return errorMessage(err)
        }
      },
      register: async (input) => {
        try {
          await authApi.register(input)
          return null
        } catch (err) {
          return errorMessage(err)
        }
      },
    }),
    [user, status, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** The logged-in user, for pages that only render when signed in. */
// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const { user } = useAuth()
  if (!user) throw new Error('useUser needs a logged-in user')
  return user
}
