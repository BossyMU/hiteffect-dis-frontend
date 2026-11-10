import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { authApi } from '@/api'
import { errorMessage } from '@/api/client'
import { AuthLayout } from '@/components/layout'
import { Button, Field, TextInput } from '@/components/ui'
import { PATHS } from '@/routes/paths'

/**
 * "Forgot password": e-mails a one-time link to set a new password. The answer is the same whether
 * or not the e-mail has an account, so the page can't be used to find out who our shops are.
 */
export default function ForgotPasswordPage() {
  const location = useLocation()
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ email: string; minutes: number } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError('Enter the e-mail you log in with')
    setBusy(true)
    try {
      const res = await authApi.forgotPassword(address)
      setSent({ email: address, minutes: res.minutes })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your e-mail">
        <div className="space-y-4 text-sm">
          <p>
            If <span className="font-semibold">{sent.email}</span> has an account, we've sent it a link to set
            a new password. The link works once, for {sent.minutes} minutes.
          </p>
          <p className="text-muted-foreground">
            Nothing after a few minutes? Check your spam folder, and that this is the e-mail you log in with.
            You can ask for a new link in a minute, or contact us.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSent(null)}>
            Use another e-mail
          </Button>
        </div>
        <BackToLogin />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the e-mail you log in with. We'll send you a link."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={error}>
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
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Sending…' : 'Send me a link'}
        </Button>
      </form>
      <BackToLogin />
    </AuthLayout>
  )
}

function BackToLogin() {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Remembered it?{' '}
      <Link to={PATHS.login} className="font-semibold text-info hover:underline">
        Log in
      </Link>
    </p>
  )
}
