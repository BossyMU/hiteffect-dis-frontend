import type { ReactNode } from 'react'
import { usePaymentOptions } from '@/hooks/usePaymentOptions'
import type { DeliveryMethod } from '@/types'
import { cn } from '@/utils/cn'

/**
 * EMS to the shop's address, or pick-up at our warehouse (no shipping). Two radio cards, used in the
 * cart, when accepting a pre-order offer, and on a pre-order before its stock arrives.
 */
export function DeliveryChoice({
  value,
  onChange,
  emsNote,
  disabled,
  name = 'delivery',
}: {
  value: DeliveryMethod
  onChange: (method: DeliveryMethod) => void
  /** Under "Thailand Post EMS": the price, or when it is charged. */
  emsNote: string
  disabled?: boolean
  /** Radio group name: unique per form on the page. */
  name?: string
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Delivery</legend>
      <Option
        name={name}
        checked={value === 'ems'}
        onSelect={() => onChange('ems')}
        title="Thailand Post EMS"
      >
        {emsNote}
      </Option>
      <Option
        name={name}
        checked={value === 'pickup'}
        onSelect={() => onChange('pickup')}
        title="Pick up at our warehouse · free"
      >
        <PickupPlace />
      </Option>
    </fieldset>
  )
}

function Option({
  name,
  checked,
  onSelect,
  title,
  children,
}: {
  name: string
  checked: boolean
  onSelect: () => void
  title: string
  children: ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 text-sm transition',
        checked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-foreground/40',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 accent-primary"
      />
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{children}</span>
      </span>
    </label>
  )
}

/** Where and when shops can pick up, from the backend's settings. */
export function PickupPlace({ className }: { className?: string }) {
  const options = usePaymentOptions()
  if (!options) return <span className={className}>…</span>
  const { address, hours } = options.pickup
  return (
    <span className={className}>
      {address || 'Our warehouse'}
      {hours && <> · {hours}</>}
    </span>
  )
}
