import { JSX, lazy } from 'react'

// prettier-ignore
const routes: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  // Shared E2E tests
  '/basic-io/useQueryState':                lazy(() => import('./routes/basic-io.useQueryState')),
  '/basic-io/useQueryStates':               lazy(() => import('./routes/basic-io.useQueryStates')),
  '/conditional-rendering/useQueryState':   lazy(() => import('./routes/conditional-rendering.useQueryState')),
  '/conditional-rendering/useQueryStates':  lazy(() => import('./routes/conditional-rendering.useQueryStates')),
  '/form/useQueryState':                    lazy(() => import('./routes/form.useQueryState')),
  '/form/useQueryStates':                   lazy(() => import('./routes/form.useQueryStates')),
  '/hash-preservation':                     lazy(() => import('./routes/hash-preservation')),
  '/life-and-death':                        lazy(() => import('./routes/life-and-death')),
  '/linking/useQueryState':                 lazy(() => import('./routes/linking.useQueryState')),
  '/linking/useQueryState/other':           lazy(() => import('./routes/linking.useQueryState.other')),
  '/linking/useQueryStates':                lazy(() => import('./routes/linking.useQueryStates')),
  '/linking/useQueryStates/other':          lazy(() => import('./routes/linking.useQueryStates.other')),
  '/pretty-urls':                           lazy(() => import('./routes/pretty-urls')),
  '/referential-stability/useQueryState':   lazy(() => import('./routes/referential-stability.useQueryState')),
  '/referential-stability/useQueryStates':  lazy(() => import('./routes/referential-stability.useQueryStates')),
  '/routing/useQueryState':                 lazy(() => import('./routes/routing.useQueryState')),
  '/routing/useQueryState/other':           lazy(() => import('./routes/routing.useQueryState.other')),
  '/routing/useQueryStates':                lazy(() => import('./routes/routing.useQueryStates')),
  '/routing/useQueryStates/other':          lazy(() => import('./routes/routing.useQueryStates.other')),
  '/scroll':                                lazy(() => import('./routes/scroll')),

  // Local tests
  '/push/useQueryState':                    lazy(() => import('./routes/push.useQueryState')),
  '/push/useQueryStates':                   lazy(() => import('./routes/push.useQueryStates')),
  '/rate-limits':                           lazy(() => import('./routes/rate-limits')),
  '/shallow/useQueryState':                 lazy(() => import('./routes/shallow.useQueryState')),
  '/shallow/useQueryStates':                lazy(() => import('./routes/shallow.useQueryStates')),
  '/stitching':                             lazy(() => import('./routes/stitching')),

  // Render count
  '/render-count/useQueryState/true/replace/false':   lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/true/replace/true':    lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/true/push/false':      lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/true/push/true':       lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/false/replace/false':  lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/false/replace/true':   lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/false/push/false':     lazy(() => import('./routes/render-count')),
  '/render-count/useQueryState/false/push/true':      lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/true/replace/false':  lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/true/replace/true':   lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/true/push/false':     lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/true/push/true':      lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/false/replace/false': lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/false/replace/true':  lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/false/push/false':    lazy(() => import('./routes/render-count')),
  '/render-count/useQueryStates/false/push/true':     lazy(() => import('./routes/render-count')),

  // Reproductions
  '/repro-359': lazy(() => import('./routes/repro-359')),
  '/repro-982': lazy(() => import('./routes/repro-982')),
}

export function Router() {
  const Route = routes[location.pathname]
  if (!Route) {
    return <>404 not found</>
  }
  return <Route />
}
