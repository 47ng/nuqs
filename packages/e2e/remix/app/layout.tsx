import { Outlet, Link as RemixLink, useNavigate } from '@remix-run/react'
import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'

function Link({ href, ...props }: LinkProps) {
  return <RemixLink to={href} {...props} />
}

export default function RootLayout() {
  return (
    <>
      <HydrationMarker />
      <LinkProvider Link={Link}>
        <RouterProvider useRouter={useRouter}>
          <Outlet />
        </RouterProvider>
      </LinkProvider>
    </>
  )
}

function useRouter(): Router {
  const navigate = useNavigate()
  return {
    replace(url, options) {
      if (options.shallow) {
        history.replaceState(history.state, '', url)
      } else {
        navigate(url, { replace: true })
      }
    },
    push(url, options) {
      if (options.shallow) {
        history.pushState(history.state, '', url)
      } else {
        navigate(url, { replace: false })
      }
    }
  }
}
