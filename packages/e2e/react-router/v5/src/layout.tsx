import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import { type ReactNode } from 'react'
import { Link as ReactRouterLink, useHistory } from 'react-router-dom'

function Link({ href, ...props }: LinkProps) {
  return <ReactRouterLink to={href} {...props} />
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider useRouter={useRouter}>{children}</RouterProvider>
      </LinkProvider>
    </>
  )
}

function useRouter(): Router {
  const history = useHistory()
  return {
    replace(url) {
      history.replace(url)
    },
    push(url) {
      history.push(url)
    }
  }
}
