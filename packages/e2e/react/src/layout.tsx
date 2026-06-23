import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import type { ReactNode } from 'react'

function Link({ href, ...props }: LinkProps) {
  return <a href={href} {...props} />
}

const router: Router = {
  replace(url, options) {
    if (options.shallow) {
      history.replaceState(history.state, '', url)
    } else {
      location.replace(url)
    }
  },
  push(url, options) {
    if (options.shallow) {
      history.pushState(history.state, '', url)
    } else {
      location.assign(url)
    }
  }
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider router={router}>{children}</RouterProvider>
      </LinkProvider>
    </>
  )
}
