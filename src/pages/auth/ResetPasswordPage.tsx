import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { authApi } from '@/api'
import { errorMessage } from '@/api/client'
import { AuthLayout } from '@/components/layout'
import { Button, Field, PasswordInput } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'

/**
 * From the e-mailed link (/reset-password?token=…): set a new password. The link works once and
 * expires; afterwards every older login of the account is logged out, so this logs out here too
 * and goes to the login page.
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [token] = useState(() => params.get('token') ?? '')
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [account, setAccount] = useState<{ email: string } | null>(null)
  const [linkError, setLinkError] = useState<string | null>(token ? null : 'This link is not complete.')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [errors, setErrors] = useState<{ password?: string; again?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Keep the token out of the address bar (and the browser history) once read.
    window.history.replaceState(window.history.state, '', PATHS.resetPassword)
    if (!token) return
    authApi.checkPasswordReset(token).then(setAccount, (err) => setLinkError(errorMessage(err)))
  }, [token])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (password.length < 8) next.password = 'Use at least 8 characters'
    else if (again !== password) next.again = "The two passwords don't match"
    if (Object.keys(next).length) return setErrors(next)
    setBusy(true)
    try {
      const { email } = await authApi.resetPassword(token, password)
      if (user) logout()
      navigate(PATHS.login, { replace: true, state: { passwordReset: true, email } })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
      setBusy(false)
    }
  }

  if (linkError) {
    return (
      <AuthLayout title="This link doesn't work">
        <p className="text-sm">{linkError}</p>
        <Button className="mt-4 w-full" onClick={() => navigate(PATHS.forgotPassword)}>
          Send me a new link
        </Button>
        <p className="mt-6 text-center text-sm">
          <Link to={PATHS.login} className="font-semibold text-info hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={account ? `For ${account.email}` : 'Checking your link…'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            disabled={!account}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors({})
            }}
          />
        </Field>
        <Field label="New password again" htmlFor="again" error={errors.again}>
          <PasswordInput
            id="again"
            autoComplete="new-password"
            value={again}
            disabled={!account}
            onChange={(e) => {
              setAgain(e.target.value)
              setErrors({})
            }}
          />
        </Field>
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={busy || !account}>
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
