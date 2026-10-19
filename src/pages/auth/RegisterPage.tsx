import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/layout'
import { Button, Field, TextArea, TextInput } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { PATHS } from '@/routes/paths'

const EMPTY = { email: '', password: '', shopName: '', contactName: '', phone: '', address: '' }

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY | 'form', string>>>({})
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!form.shopName.trim()) next.shopName = 'Enter your shop name'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email'
    if (form.password.length < 8) next.password = 'Use at least 8 characters'
    if (Object.keys(next).length) return setErrors(next)

    setBusy(true)
    const message = await register({ ...form, email: form.email.trim() })
    setBusy(false)
    if (message) return setErrors({ form: message })
    navigate(PATHS.login, { replace: true, state: { registered: true } })
  }

  return (
    <AuthLayout title="Request an account" subtitle="We check every shop before giving access to pre-orders.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Shop name" htmlFor="shopName" error={errors.shopName}>
          <TextInput id="shopName" value={form.shopName} onChange={(e) => set('shopName')(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact name" htmlFor="contactName">
            <TextInput
              id="contactName"
              value={form.contactName}
              onChange={(e) => set('contactName')(e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <TextInput
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Shipping address" htmlFor="address">
          <TextArea id="address" value={form.address} onChange={(e) => set('address')(e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters">
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
          />
        </Field>
        {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Sending…' : 'Request account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already approved?{' '}
        <Link to={PATHS.login} className="font-semibold text-info hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
