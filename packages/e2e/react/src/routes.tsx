import { JSX, lazy } from 'react'

// prettier-ignore
const routes: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  '/hash-preservation':             lazy(() => import('./routes/hash-preservation')),
  '/basic-io/useQueryState':        lazy(() => import('./routes/basic-io.useQueryState')),
  '/basic-io/useQueryStates':       lazy(() => import('./routes/basic-io.useQueryStates')),
  '/push/useQueryState':            lazy(() => import('./routes/push.useQueryState')),
  '/push/useQueryStates':           lazy(() => import('./routes/push.useQueryStates')),
  '/linking/useQueryState':         lazy(() => import('./routes/linking.useQueryState')),
  '/linking/useQueryState/other':   lazy(() => import('./routes/linking.useQueryState.other')),
  '/linking/useQueryStates':        lazy(() => import('./routes/linking.useQueryStates')),
  '/linking/useQueryStates/other':  lazy(() => import('./routes/linking.useQueryStates.other')),
  '/routing/useQueryState':         lazy(() => import('./routes/routing.useQueryState')),
  '/routing/useQueryState/other':   lazy(() => import('./routes/routing.useQueryState.other')),
  '/routing/useQueryStates':        lazy(() => import('./routes/routing.useQueryStates')),
  '/routing/useQueryStates/other':  lazy(() => import('./routes/routing.useQueryStates.other')),
  '/shallow/useQueryState':         lazy(() => import('./routes/shallow.useQueryState')),
  '/shallow/useQueryStates':        lazy(() => import('./routes/shallow.useQueryStates')),
  '/form/useQueryState':            lazy(() => import('./routes/form.useQueryState')),
  '/form/useQueryStates':           lazy(() => import('./routes/form.useQueryStates')),
}

export function Router() {
  const Route = routes[location.pathname]
  if (!Route) {
    return <>404 not found</>
  }
  return <Route />
}
