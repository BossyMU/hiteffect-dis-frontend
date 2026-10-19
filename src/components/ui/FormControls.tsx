import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/utils/cn'

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

const FIELD_BASE =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 disabled:bg-muted'

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD_BASE, className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={cn(FIELD_BASE, 'resize-y', className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(FIELD_BASE, className)} {...props} />
}

/** Label + control + optional hint and inline error, stacked. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/** Wide search box shown above tables. */
export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="search"
      className={cn(
        'min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground',
        className,
      )}
      {...props}
    />
  )
}
