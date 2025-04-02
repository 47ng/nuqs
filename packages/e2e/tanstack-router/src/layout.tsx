import { Link as TanStackLink, useNavigate } from '@tanstack/react-router'
import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import type { ReactNode } from 'react'

function Link({ href, ...props }: LinkProps) {
  return <TanStackLink to={href} {...props} />
}

function useRouter(): Router {
  const navigate = useNavigate()
  return {
    replace(url) {
      navigate({
        to: url,
        replace: true
      })
    },
    push(url) {
      navigate({
        to: url,
        replace: false
      })
    }
  }
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider useRouter={useRouter}>{children}</RouterProvider>
      </LinkProvider>
    </>
  )
}
