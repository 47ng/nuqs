import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { RouterProvider, type Router } from 'e2e-shared/components/router'
import { useEffect, type ReactNode } from 'react'
import { Link as ReactRouterLink, useHistory } from 'react-router-dom'

function Link({ href, ...props }: LinkProps) {
  return <ReactRouterLink to={href} {...props} />
}

// The history subscription lives in a null-rendering leaf component, and
// the Router context value is a stable module-level object reading from a
// ref: this keeps navigation updates from re-rendering the app shell (which
// would pollute render-count tests).
const historyRef: { current: ReturnType<typeof useHistory> | null } = {
  current: null
}

function RouterBinder() {
  const history = useHistory()
  useEffect(() => {
    historyRef.current = history
  }, [history])
  return null
}

function getHistory() {
  if (historyRef.current === null) {
    throw new Error('Router is not bound yet')
  }
  return historyRef.current
}

const router: Router = {
  replace(url) {
    getHistory().replace(url)
  },
  push(url) {
    getHistory().push(url)
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
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
