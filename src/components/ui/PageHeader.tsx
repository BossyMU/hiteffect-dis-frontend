import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  /** Optional "← Back" link above the title. */
  back?: { to: string; label: string }
}

/** Page title in the display face (Cinzel), with optional actions on the right. */
export function PageHeader({ title, subtitle, actions, back }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {back && (
        <Link to={back.to} className="text-sm text-info hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
