import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { EnvBanner } from './EnvBanner'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileTopBar } from './MobileTopBar'
import { Sidebar } from './Sidebar'

/** App shell: sidebar on desktop; top bar, drawer and bottom nav on mobile. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = () => setDrawerOpen(false)
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()

  // Start each page at the top.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EnvBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeDrawer}>
            <div className="h-full w-[232px]" onClick={(e) => e.stopPropagation()}>
              <Sidebar onNavigate={closeDrawer} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MobileTopBar onOpenMenu={() => setDrawerOpen(true)} />
          <main ref={main} className="flex-1 overflow-y-auto bg-background px-4 py-5 md:px-8 md:py-7">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </div>
  )
}
