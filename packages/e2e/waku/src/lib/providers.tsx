'use client'

import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProps, LinkProvider } from 'e2e-shared/components/link'
import { RouterProvider } from 'e2e-shared/components/router'
import type { ReactNode } from 'react'
import { Link as WakuLink, useRouter as useWakuRouter } from 'waku'

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
  const router = useWakuRouter()
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider
          useRouter={() => ({
            push(url) {
              // @ts-expect-error Waku is type-safe, but our router abstraction is not
              return router.push(url)
            },
            replace(url) {
              // @ts-expect-error Waku is type-safe, but our router abstraction is not
              return router.replace(url)
            }
          })}
        >
          {children}
        </RouterProvider>
      </LinkProvider>
    </>
  )
}
