'use client'

import { LinkProvider } from 'e2e-shared/components/link'
import { type Router, RouterProvider } from 'e2e-shared/components/router'
import Link from 'next/link'
import { useRouter as useNextRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

// The Next.js router subscription lives in a null-rendering leaf component,
// and the Router context value is a stable module-level object reading from
// a ref: this keeps navigation updates from re-rendering the app shell
// (which would pollute render-count tests), and avoids calling a hook
// obtained via context, which breaks under the React Compiler with
// next@16.3.0-canary.20+ (vercel/next.js#93633).
const routerRef: { current: ReturnType<typeof useNextRouter> | null } = {
  current: null
}

function RouterBinder() {
  const router = useNextRouter()
  useEffect(() => {
    routerRef.current = router
  }, [router])
  return null
}

function getNextRouter() {
  if (routerRef.current === null) {
    throw new Error('Next.js router is not bound yet')
  }
  return routerRef.current
}

const router: Router = {
  replace(url, { shallow }) {
    if (shallow) {
      history.replaceState(null, '', url)
    } else {
      getNextRouter().replace(url)
    }
  },
  push(url, { shallow }) {
    if (shallow) {
      history.pushState(null, '', url)
    } else {
      getNextRouter().push(url)
    }
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LinkProvider Link={Link}>
      <RouterBinder />
      <RouterProvider router={router}>{children}</RouterProvider>
    </LinkProvider>
  )
}
