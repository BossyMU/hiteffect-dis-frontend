import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/utils/cn'
import { Overline } from './Overline'

interface StatCardProps {
  label: string
  value: string
  sub?: ReactNode
  /** Highlight the value in the brand color. */
  accent?: boolean
  /** Make the whole card a link. */
  to?: string
}

export function StatCard({ label, value, sub, accent, to }: StatCardProps) {
  const body = (
    <>
      <Overline className="mb-2">{label}</Overline>
      <p
        className={cn('font-mono text-2xl font-semibold', accent ? 'text-primary-strong' : 'text-foreground')}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </>
  )
  const className =
    'block rounded-lg border border-border bg-card p-5 shadow-[0_8px_24px_rgba(23,26,31,0.05)]'
  return to ? (
    <Link to={to} className={cn(className, 'transition hover:border-ring')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** Responsive row of stat cards. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
  )
}
