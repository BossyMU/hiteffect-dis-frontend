import { BrandMark } from './BrandMark'

export function MobileTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-2 md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={onOpenMenu}
        className="flex h-8 w-8 items-center justify-center rounded text-lg text-foreground"
      >
        ☰
      </button>
      <BrandMark className="h-8" />
      <div className="w-8" />
    </div>
  )
}
