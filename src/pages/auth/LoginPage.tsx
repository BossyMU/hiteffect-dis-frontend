import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/layout'
import { Button, Field, TextInput } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Enter your email and password')
    setBusy(true)
    const message = await login(email.trim(), password)
    setBusy(false)
    if (message) return setError(message)
    const from = (location.state as { from?: string } | null)?.from
    navigate(from && from !== PATHS.login ? from : PATHS.home, { replace: true })
  }

  return (
    <AuthLayout title="Log in" subtitle="Pre-orders and wholesale orders for Hit Effect shops">
      {justRegistered && (
        <p className="mb-4 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Thanks for signing up. We will approve your account and set your tier, then you can log in.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={error}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New shop?{' '}
        <Link to={PATHS.register} className="font-semibold text-info hover:underline">
          Request an account
        </Link>
      </p>
    </AuthLayout>
  )
}
