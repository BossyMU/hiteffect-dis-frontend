import { cn } from '@/utils/cn'

/** The Hit Effect wordmark (from hiteffect-frontend). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="Hit Effect — Boardgame & TCG"
      className={cn('h-10 w-auto object-contain', className)}
    />
  )
}
