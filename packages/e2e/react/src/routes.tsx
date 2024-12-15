import { JSX, lazy } from 'react'

// prettier-ignore
const routes: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  '/hash-preservation':       lazy(() => import('./routes/hash-preservation')),
  '/basic-io/useQueryState':  lazy(() => import('./routes/basic-io.useQueryState')),
  '/basic-io/useQueryStates': lazy(() => import('./routes/basic-io.useQueryStates')),
  '/push/useQueryState':      lazy(() => import('./routes/push.useQueryState')),
  '/push/useQueryStates':     lazy(() => import('./routes/push.useQueryStates')),
}

export function Router() {
  const Route = routes[location.pathname]
  if (!Route) {
    return <>404 not found</>
  }
  return <Route />
}
