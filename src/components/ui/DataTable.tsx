import type { HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/**
 * A column header. `align: 'right'` is for numbers and money (match it in the cells); `className`
 * can hide a column on small screens (`hidden sm:table-cell`, same on its cells).
 */
export type TableHeader = string | { label: string; align?: 'left' | 'right'; className?: string }

interface DataTableProps {
  headers: TableHeader[]
  children: ReactNode
  /** Rows under the body, such as totals (rendered in a <tfoot>). */
  footer?: ReactNode
  /** Shown under the header row when there are no rows. */
  emptyMessage?: ReactNode
  isEmpty?: boolean
}

/** Bordered, horizontally scrollable table with the standard header style. */
export function DataTable({ headers, children, footer, emptyMessage, isEmpty }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            {headers.map((h, i) => {
              const { label, align, className } =
                typeof h === 'string' ? { label: h, align: 'left', className: '' } : h
              return (
                <th
                  key={`${label}-${i}`}
                  className={cn(
                    'px-4 py-3 font-mono text-[11px] font-medium whitespace-nowrap uppercase tracking-widest text-muted-foreground',
                    align === 'right' ? 'text-right' : 'text-left',
                    className,
                  )}
                >
                  {label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
        {footer && <tfoot className="border-t border-border">{footer}</tfoot>}
      </table>
      {isEmpty && <EmptyState>{emptyMessage}</EmptyState>}
    </div>
  )
}

/** Zebra-striped row that highlights on hover. */
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border last:border-b-0 odd:bg-card even:bg-secondary hover:bg-muted/70',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{children}</div>
}
