import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'

/** Login and sign-up: a centred card on the Hit Effect gradient. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="brand-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[14px] border border-sidebar-border bg-card p-8 shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <BrandMark className="h-14" />
          <p className="font-mono text-[10.5px] tracking-[2px] text-muted-foreground uppercase">
            Distributor portal
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
