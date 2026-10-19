import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ProductImageProps {
  src: string
  alt: string
  setCode: string
  game: string
  /** Badges laid over the top-left corner. */
  children?: ReactNode
  className?: string
  /** Zoom slightly when the surrounding `.group` is hovered (cards). */
  hoverZoom?: boolean
}

/**
 * Shopify's image CDN resizes on request: ask for a card-sized copy instead of the full photo
 * (often 2000–3000 px). Other links are used as they are.
 */
function sized(src: string, width: number) {
  if (!src.includes('cdn.shopify.com/')) return src
  try {
    const url = new URL(src)
    url.searchParams.set('width', String(width))
    return url.toString()
  } catch {
    return src
  }
}

/** Square product photo on white, or the set code on a brand gradient until an admin adds a photo. */
export function ProductImage({ src, alt, setCode, game, children, className, hoverZoom }: ProductImageProps) {
  return (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {src ? (
        <img
          src={sized(src, 800)}
          alt={alt}
          loading="lazy"
          className={cn(
            'h-full w-full object-contain p-4',
            hoverZoom && 'transition-transform duration-300 group-hover:scale-[1.03]',
          )}
        />
      ) : (
        <div className="brand-gradient flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
          <span className="font-display text-3xl font-bold text-foreground/80">{setCode || '—'}</span>
          <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            {game}
          </span>
        </div>
      )}
      {children && <div className="absolute top-2 left-2 flex flex-wrap gap-1">{children}</div>}
    </div>
  )
}

/** Small label on a product image: dark for "Pre-order", grey for "Sold out", orange for actions. */
export function ImageBadge({
  tone = 'dark',
  children,
}: {
  tone?: 'dark' | 'muted' | 'primary' | 'success'
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 font-mono text-[10.5px] tracking-wider uppercase',
        tone === 'dark' && 'bg-badge text-white',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        tone === 'primary' && 'bg-primary text-primary-foreground',
        tone === 'success' && 'bg-success text-white',
      )}
    >
      {children}
    </span>
  )
}
