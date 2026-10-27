import { useState } from 'react'
import { authApi, type ProfileInput } from '@/api'
import {
  Button,
  Card,
  DetailList,
  Field,
  PageHeader,
  SectionTitle,
  TextArea,
  TextInput,
} from '@/components/ui'
import { useAuth, useUser } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatDate } from '@/utils/format'

/** Contact, shipping and tax details (for tax invoices), and password. */
export default function ProfilePage() {
  const user = useUser()
  const { setUser } = useAuth()
  const { run } = useToast()
  const [form, setForm] = useState<Required<ProfileInput>>({
    shopName: user.shopName,
    contactName: user.contactName,
    phone: user.phone,
    address: user.address,
    legalName: user.legalName,
    taxId: user.taxId,
    branchCode: user.branchCode,
    taxAddress: user.taxAddress,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({})
  const [saving, setSaving] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const set = (key: keyof ProfileInput) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function save() {
    const next: typeof errors = {}
    if (!form.shopName.trim()) next.shopName = 'Enter a name'
    if (form.taxId && !/^\d{13}$/.test(form.taxId)) next.taxId = 'The tax ID has 13 digits'
    if (!/^\d{5}$/.test(form.branchCode)) next.branchCode = '5 digits; 00000 is the head office'
    if (Object.keys(next).length) return setErrors(next)
    setSaving(true)
    await run(async () => setUser(await authApi.updateProfile(form)), 'Profile saved')
    setSaving(false)
  }

  async function changePassword() {
    if (!passwords.current) return setPasswordError('Enter your current password')
    if (passwords.next.length < 8) return setPasswordError('The new password needs at least 8 characters')
    const ok = await run(() => authApi.changePassword(passwords.current, passwords.next), 'Password changed')
    if (ok) setPasswords({ current: '', next: '' })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle={user.email} />

      {user.role === 'shop' && (
        <Card>
          <DetailList
            items={[
              ['Tier', user.tierName ?? '—'],
              ['Member since', formatDate(user.createdAt)],
            ]}
          />
        </Card>
      )}

      <Card className="space-y-4">
        <SectionTitle>Contact and shipping</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={user.role === 'shop' ? 'Shop name' : 'Display name'}
            htmlFor="shopName"
            error={errors.shopName}
          >
            <TextInput
              id="shopName"
              value={form.shopName}
              onChange={(e) => set('shopName')(e.target.value)}
            />
          </Field>
          <Field label="Contact name" htmlFor="contactName">
            <TextInput
              id="contactName"
              value={form.contactName}
              onChange={(e) => set('contactName')(e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <TextInput id="phone" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
          </Field>
        </div>
        <Field
          label={user.role === 'admin' ? 'Warehouse address' : 'Shipping address'}
          htmlFor="address"
          hint={
            user.role === 'admin'
              ? 'Shown to shops that pick up their orders, and printed as the sender on shipping labels.'
              : undefined
          }
        >
          <TextArea id="address" value={form.address} onChange={(e) => set('address')(e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>Tax invoice details</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Used on your full tax invoices. Leave empty if you don't need them.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Registered business name" htmlFor="legalName">
            <TextInput
              id="legalName"
              value={form.legalName}
              onChange={(e) => set('legalName')(e.target.value)}
            />
          </Field>
          <Field label="Tax ID (13 digits)" htmlFor="taxId" error={errors.taxId}>
            <TextInput
              id="taxId"
              inputMode="numeric"
              value={form.taxId}
              onChange={(e) => set('taxId')(e.target.value.trim())}
            />
          </Field>
          <Field
            label="Branch code"
            htmlFor="branchCode"
            error={errors.branchCode}
            hint="00000 = head office"
          >
            <TextInput
              id="branchCode"
              inputMode="numeric"
              value={form.branchCode}
              onChange={(e) => set('branchCode')(e.target.value.trim())}
            />
          </Field>
        </div>
        <Field label="Tax address" htmlFor="taxAddress">
          <TextArea
            id="taxAddress"
            value={form.taxAddress}
            onChange={(e) => set('taxAddress')(e.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>Password</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password" htmlFor="currentPassword">
            <TextInput
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwords.current}
              onChange={(e) => {
                setPasswords((p) => ({ ...p, current: e.target.value }))
                setPasswordError(null)
              }}
            />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={passwordError}>
            <TextInput
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwords.next}
              onChange={(e) => {
                setPasswords((p) => ({ ...p, next: e.target.value }))
                setPasswordError(null)
              }}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => void changePassword()}>
            Change password
          </Button>
        </div>
      </Card>
    </div>
  )
}
