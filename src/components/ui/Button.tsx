import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'soft' | 'outline' | 'destructive'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  /** Main call to action (Hit Effect orange). */
  primary: 'bg-primary text-primary-foreground font-semibold hover:brightness-95',
  /** Cancel / close. */
  secondary: 'bg-muted text-muted-foreground hover:text-foreground',
  /** Inline row actions like "Edit" or "Review". */
  soft: 'bg-primary/10 text-primary-strong font-medium hover:bg-primary/15',
  /** Secondary action with a cyan outline, as on the storefront. */
  outline: 'border border-ring bg-card text-foreground font-medium hover:bg-ring/5',
  /** Rejecting or cancelling something. */
  destructive: 'bg-danger text-white font-semibold hover:brightness-95',
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-md',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        SIZES[size],
        VARIANTS[variant],
        'transition disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
