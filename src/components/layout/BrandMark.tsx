import { cn } from '@/utils/cn'

/** The Deck Drive Distribution logo: a transparent SVG, so it sits on any background. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      alt="Deck Drive Distribution"
      className={cn('h-9 w-auto max-w-full object-contain object-left', className)}
    />
  )
}
