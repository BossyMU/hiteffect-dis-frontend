import { useState } from 'react'
import { PAGE_SIZE } from '@/constants/pagination'

/** Client-side pagination. Call `setPage(1)` whenever the filters change. */
export function usePagination<T>(items: T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pages)
  const paged = items.slice((current - 1) * pageSize, current * pageSize)
  return { page: current, setPage, paged, pageSize, total: items.length }
}
