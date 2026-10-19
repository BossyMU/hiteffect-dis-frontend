import { cn } from '@/utils/cn'

interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}

type PageToken = number | 'ellipsis'

/** Page numbers to render: all pages when ≤ 7, otherwise first, last and the current ±1. */
function visiblePages(page: number, pages: number): PageToken[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const near = [...new Set([1, pages, page - 1, page, page + 1])].filter((p) => p >= 1 && p <= pages)
  near.sort((a, b) => a - b)
  const result: PageToken[] = []
  let prev = 0
  for (const p of near) {
    if (p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

const pageButton = (active: boolean) =>
  cn(
    'rounded-md border px-2.5 py-1 font-mono text-xs leading-normal font-semibold disabled:cursor-default disabled:opacity-35',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-card text-muted-foreground',
  )

export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between px-1 pt-3">
      <span className="font-mono text-xs text-muted-foreground">
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button className={pageButton(false)} disabled={page === 1} onClick={() => onChange(page - 1)}>
          ‹ Prev
        </button>
        {visiblePages(page, pages).map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 font-mono text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              className={pageButton(p === page)}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button className={pageButton(false)} disabled={page === pages} onClick={() => onChange(page + 1)}>
          Next ›
        </button>
      </div>
    </nav>
  )
}
