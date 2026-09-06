'use client'

import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import { useEffect, type ReactNode } from 'react'
import { Link as WakuLink, useRouter } from 'waku'

// Waku's generated route types (src/pages.gen.ts) reject the untyped URLs
// of the shared harness.
const untyped = (href: string) => href as never

function Link({ href, replace, ...props }: LinkProps) {
  return <WakuLink to={untyped(href)} {...props} />
}

type Navigate = Pick<ReturnType<typeof useRouter>, 'push' | 'replace'>

const navigateRef: { current: Navigate | null } = { current: null }

// The navigation subscription lives in a null-rendering leaf component, and
// the Router context value is a stable module-level object reading from a
// ref: this keeps navigation updates from re-rendering the app shell (which
// would break render-count tests).
function RouterBinder() {
  const { push, replace } = useRouter()
  useEffect(() => {
    navigateRef.current = { push, replace }
  }, [push, replace])
  return null
}

function getNavigate() {
  if (navigateRef.current === null) {
    throw new Error('Router is not bound yet')
  }
  return navigateRef.current
}

const router: Router = {
  replace(url) {
    void getNavigate().replace(untyped(url))
  },
  push(url) {
    void getNavigate().push(untyped(url))
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      <RouterBinder />
      <LinkProvider Link={Link}>
        <RouterProvider router={router}>{children}</RouterProvider>
      </LinkProvider>
    </>
  )
}
