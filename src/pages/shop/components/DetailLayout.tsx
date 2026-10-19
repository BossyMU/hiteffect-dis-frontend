import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { DetailList, Overline } from '@/components/ui'
import { PATHS } from '@/routes/paths'
import { formatDate } from '@/utils/format'

/** Where "back" goes, named after the list the shop came from. */
function labelFor(from: string) {
  if (from.startsWith(PATHS.myPreorders)) return 'My pre-orders'
  if (from.startsWith(PATHS.preorders)) return 'Pre-orders'
  if (from.startsWith(PATHS.products)) return 'Products'
  return null
}

/**
 * Product and pre-order pages, laid out like a storefront product page: the photo on the left,
 * name, price and the main action on the right, details below.
 */
export function DetailLayout({
  backTo,
  backLabel,
  image,
  children,
}: {
  /** The list to go back to, when the shop didn't arrive from one. */
  backTo: string
  backLabel: string
  image: ReactNode
  children: ReactNode
}) {
  const location = useLocation()
  // Cards pass the list's address (with its filters), so "back" returns to the same view.
  const from = (location.state as { from?: string } | null)?.from
  return (
    <div className="space-y-5">
      <Link to={from ?? backTo} className="inline-block text-sm text-info hover:underline">
        ← {(from && labelFor(from)) || backLabel}
      </Link>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div className="md:sticky md:top-6 md:self-start">{image}</div>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  )
}

/** Game, category and "allocation only" above the title. */
export function ItemOverline({ parts }: { parts: (string | null | undefined | false)[] }) {
  return <Overline>{parts.filter(Boolean).join(' · ')}</Overline>
}

/** The product facts shown under the main action. */
export function ProductFacts({
  sku,
  category,
  setCode,
  boxesPerCase,
  releaseDate,
  extra = [],
}: {
  sku: string
  category: string
  setCode: string
  boxesPerCase: number | null
  releaseDate: string | null
  extra?: [string, ReactNode][]
}) {
  return (
    <div className="space-y-3 border-t border-border pt-5">
      <h2 className="text-sm font-semibold">Details</h2>
      <DetailList
        items={[
          ['Product code', <span className="font-mono">{sku}</span>],
          ['Category', category || '—'],
          ['Set', setCode || '—'],
          ['Per case', boxesPerCase ? `${boxesPerCase} per case` : '—'],
          ['Release', formatDate(releaseDate)],
          ...extra,
        ]}
      />
    </div>
  )
}

/** The product description, when an admin wrote one. */
export function Description({ text }: { text: string }) {
  if (!text.trim()) return null
  return (
    <div className="space-y-2 border-t border-border pt-5">
      <h2 className="text-sm font-semibold">Description</h2>
      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{text}</p>
    </div>
  )
}
