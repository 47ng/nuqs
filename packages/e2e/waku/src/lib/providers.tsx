'use client'

import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProps, LinkProvider } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import type { ReactNode } from 'react'
import { Link as WakuLink, useRouter as useWakuRouter } from 'waku'

function useRouter(): Router {
  const router = useWakuRouter()
  return {
    push(url) {
      // @ts-expect-error Waku is type-safe, but our router abstraction is not
      return router.push(url)
    },
    replace(url) {
      // @ts-expect-error Waku is type-safe, but our router abstraction is not
      return router.replace(url)
    }
  }
}

function Link(props: LinkProps) {
  return (
    <WakuLink
      // @ts-expect-error Waku is type-safe, but our LinkProps abstraction is not
      to={props.href}
      {...props}
    />
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider useRouter={useRouter}>{children}</RouterProvider>
      </LinkProvider>
    </>
  )
}
