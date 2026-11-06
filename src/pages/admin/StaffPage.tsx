import { useState } from 'react'
import { adminApi } from '@/api'
import {
  Badge,
  Button,
  DataTable,
  Field,
  LoadState,
  Modal,
  ModalActions,
  PageHeader,
  PasswordInput,
  TableCell,
  TableRow,
  TextInput,
} from '@/components/ui'
import { useUser } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useApiData } from '@/hooks/useApiData'
import type { StaffMember } from '@/types'
import { formatDateTime } from '@/utils/format'

/**
 * Admins only: staff accounts. An admin adds each store clerk with a starting password; the clerk
 * logs in with it straight away and can change it in Profile. Clerks can do everything an admin can
 * except this page, and their name is kept on what they change.
 */
export default function StaffPage() {
  const me = useUser()
  const { data, status, error, reload } = useApiData(() => adminApi.staff())
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle="Store clerks have their own login and can do everything an admin can, except manage staff. Their name is shown on the stock edits, orders and payments they handle."
        actions={<Button onClick={() => setEditing('new')}>Add clerk</Button>}
      />
      <LoadState status={status} error={error} onRetry={reload}>
        <DataTable
          headers={['Name', 'E-mail', 'Role', 'Status', 'Last login', '']}
          isEmpty={(data ?? []).length === 0}
          emptyMessage="No staff accounts."
        >
          {(data ?? []).map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">
                {s.name || '—'}
                {s.id === me.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
              </TableCell>
              <TableCell className="font-mono text-xs">{s.email}</TableCell>
              <TableCell>
                <Badge tone={s.role === 'admin' ? 'primary' : 'info'}>
                  {s.role === 'admin' ? 'Admin' : 'Clerk'}
                </Badge>
              </TableCell>
              <TableCell>
                {s.status === 'approved' ? (
                  <Badge tone="success">Active</Badge>
                ) : (
                  <Badge tone="neutral">Disabled</Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {s.lastLoginAt ? formatDateTime(s.lastLoginAt) : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                {s.role === 'clerk' && (
                  <Button size="sm" variant="soft" onClick={() => setEditing(s)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </LoadState>
      {editing === 'new' && (
        <AddClerkModal
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}
      {editing && editing !== 'new' && (
        <EditClerkModal
          clerk={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}
    </div>
  )
}

const PASSWORD_HINT = 'At least 8 characters. Give it to the clerk; they can change it in Profile.'

function AddClerkModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { run } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [busy, setBusy] = useState(false)
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function save() {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Enter their name'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter their e-mail'
    if (form.password.length < 8) next.password = 'At least 8 characters'
    if (Object.keys(next).length) return setErrors(next)
    setBusy(true)
    const ok = await run(
      () =>
        adminApi.createClerk({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      `${form.name.trim()} can log in now`,
    )
    setBusy(false)
    if (ok) onSaved()
  }

  return (
    <Modal
      title="Add a store clerk"
      onClose={onClose}
      footer={
        <ModalActions onCancel={onClose} onConfirm={() => void save()} confirmLabel="Add clerk" busy={busy} />
      }
    >
      <div className="space-y-4">
        <Field label="Name" htmlFor="c-name" error={errors.name} hint="Shown on what they change.">
          <TextInput id="c-name" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Field>
        <Field label="E-mail (their login)" htmlFor="c-email" error={errors.email}>
          <TextInput
            id="c-email"
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
          />
        </Field>
        <Field label="Phone (optional)" htmlFor="c-phone">
          <TextInput id="c-phone" value={form.phone} onChange={(e) => set('phone')(e.target.value)} />
        </Field>
        <Field label="Starting password" htmlFor="c-password" error={errors.password} hint={PASSWORD_HINT}>
          <PasswordInput
            id="c-password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}

function EditClerkModal({
  clerk,
  onClose,
  onSaved,
}: {
  clerk: StaffMember
  onClose: () => void
  onSaved: () => void
}) {
  const { run } = useToast()
  const [name, setName] = useState(clerk.name)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<{ name?: string; password?: string }>({})
  const [busy, setBusy] = useState(false)
  const active = clerk.status === 'approved'

  async function save() {
    const next: typeof error = {}
    if (!name.trim()) next.name = 'Enter their name'
    if (password && password.length < 8) next.password = 'At least 8 characters'
    if (Object.keys(next).length) return setError(next)
    const body: { name?: string; password?: string } = {}
    if (name.trim() !== clerk.name) body.name = name.trim()
    if (password) body.password = password
    if (Object.keys(body).length === 0) return onClose()
    setBusy(true)
    const ok = await run(() => adminApi.updateClerk(clerk.id, body), 'Clerk saved')
    setBusy(false)
    if (ok) onSaved()
  }

  async function toggle() {
    setBusy(true)
    const ok = await run(
      () => adminApi.updateClerk(clerk.id, { status: active ? 'suspended' : 'approved' }),
      active ? `${clerk.name} can no longer log in` : `${clerk.name} can log in again`,
    )
    setBusy(false)
    if (ok) onSaved()
  }

  return (
    <Modal
      title={`Clerk: ${clerk.name || clerk.email}`}
      onClose={onClose}
      footer={
        <ModalActions onCancel={onClose} onConfirm={() => void save()} confirmLabel="Save" busy={busy} />
      }
    >
      <div className="space-y-4">
        <p className="font-mono text-xs text-muted-foreground">{clerk.email}</p>
        <Field label="Name" htmlFor="e-name" error={error.name}>
          <TextInput
            id="e-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError((x) => ({ ...x, name: undefined }))
            }}
          />
        </Field>
        <Field
          label="New password"
          htmlFor="e-password"
          error={error.password}
          hint="Only if they forgot theirs. Leave empty to keep it."
        >
          <PasswordInput
            id="e-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError((x) => ({ ...x, password: undefined }))
            }}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3">
          <p className="text-sm">
            {active
              ? 'Disable to stop them logging in. Their name stays on what they changed.'
              : 'Disabled: they cannot log in.'}
          </p>
          <Button
            size="sm"
            variant={active ? 'destructive' : 'outline'}
            disabled={busy}
            onClick={() => void toggle()}
          >
            {active ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
