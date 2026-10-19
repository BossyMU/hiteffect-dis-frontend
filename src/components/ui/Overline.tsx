import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/** Small uppercase monospace caption used for section and stat labels. */
export function Overline({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('font-mono text-[11px] uppercase tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}
