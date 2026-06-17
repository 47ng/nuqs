import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import { useEffect } from 'react'
import { Outlet, Link as ReactRouterLink, useNavigate } from 'react-router-dom'

function Link({ href, ...props }: LinkProps) {
  return <ReactRouterLink to={href} {...props} />
}

// The navigation subscription lives in a null-rendering leaf component, and
// the Router context value is a stable module-level object reading from a
// ref: this keeps navigation updates from re-rendering the app shell (which
// would pollute render-count tests).
const navigateRef: { current: ReturnType<typeof useNavigate> | null } = {
  current: null
}

function RouterBinder() {
  const navigate = useNavigate()
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])
  return null
}

function getNavigate() {
  if (navigateRef.current === null) {
    throw new Error('Router is not bound yet')
  }
  return navigateRef.current
}

const router: Router = {
  replace(url, options) {
    if (options.shallow) {
      history.replaceState(history.state, '', url)
    } else {
      getNavigate()(url, { replace: true })
    }
  },
  push(url, options) {
    if (options.shallow) {
      history.pushState(history.state, '', url)
    } else {
      getNavigate()(url, { replace: false })
    }
  }
}

export default function RootLayout() {
  return (
    <>
      <HydrationMarker />
      <RouterBinder />
      <LinkProvider Link={Link}>
        <RouterProvider router={router}>
          <Outlet />
        </RouterProvider>
      </LinkProvider>
    </>
  )
}
