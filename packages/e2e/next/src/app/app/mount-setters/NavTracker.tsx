'use client'

import { usePathname } from 'next/navigation'
import { useQueryState } from 'nuqs'
import { useLayoutEffect } from 'react'

// Lives in the shared layout, so it stays mounted across /src <-> /dest.
// It writes the current route segment from a layout effect whenever the
// pathname changes, i.e. in the same commit as the destination route.
export function NavTracker() {
  const pathname = usePathname()
  const [nav, setNav] = useQueryState('nav')
  useLayoutEffect(() => {
    void setNav(pathname?.split('/').at(-1) ?? null)
  }, [pathname])
  return <p id="nav">nav: {nav ?? 'null'}</p>
}
