import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** White panel with the storefront's soft shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(23,26,31,0.06)]',
        className,
      )}
      {...props}
    />
  )
}

/** Section heading inside a page, with optional actions. */
export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold">{children}</h2>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

/** Label / value pairs in two columns. */
export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
          <dd className="mt-0.5">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
