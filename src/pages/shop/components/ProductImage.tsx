import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  /** A click opens the photo full screen (product and pre-order pages; cards link to those). */
  enlargeable?: boolean
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
export function ProductImage({
  src,
  alt,
  setCode,
  game,
  children,
  className,
  hoverZoom,
  enlargeable,
}: ProductImageProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const img = (
    <img
      src={sized(src, 800)}
      alt={alt}
      loading="lazy"
      className={cn(
        'h-full w-full object-contain p-4',
        hoverZoom && 'transition-transform duration-300 group-hover:scale-[1.03]',
      )}
    />
  )

  return (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg border border-border bg-card',
        className,
      )}
    >
      {src && enlargeable ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge photo: ${alt}`}
          className="group/zoom block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-ring"
        >
          {img}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md bg-badge/75 px-2 py-1 text-xs text-white transition-colors group-hover/zoom:bg-badge"
          >
            <ZoomIcon />
            Enlarge
          </span>
        </button>
      ) : src ? (
        img
      ) : (
        <div className="brand-gradient flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
          <span className="font-display text-3xl font-bold text-foreground/80">{setCode || '—'}</span>
          <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            {game}
          </span>
        </div>
      )}
      {children && (
        <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">{children}</div>
      )}
      {open && <ImageViewer src={src} alt={alt} onClose={close} />}
    </div>
  )
}

/**
 * The photo full screen over a dark backdrop, as large as the screen allows. Closes on Escape, the
 * ✕, or a click beside the photo; a link opens the original file in a new tab.
 */
function ImageViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    // The page behind doesn't scroll while the photo is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[rgba(18,19,28,0.88)] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3 right-3 rounded-full bg-white/10 px-3 py-1.5 text-lg leading-none text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
      >
        ✕
      </button>
      <img
        src={sized(src, 2000)}
        alt={alt}
        className="max-h-[calc(100vh-6rem)] w-[min(100%,calc(100vh-6rem))] rounded-lg bg-white object-contain p-4"
      />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-white/80 underline hover:text-white"
      >
        Open the original in a new tab
      </a>
    </div>,
    document.body,
  )
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="4.75" />
      <path d="M10.5 10.5 14 14M7 5v4M5 7h4" strokeLinecap="round" />
    </svg>
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
