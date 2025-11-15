import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { NuqsAdapter } from './adapter'
import RootLayout from './layout'

// prettier-ignore
const routes = {
  // Shared E2E tests
  '/basic-io/useQueryState':                    lazy(() => import('./routes/basic-io.useQueryState')),
  '/basic-io/useQueryStates':                   lazy(() => import('./routes/basic-io.useQueryStates')),
  '/conditional-rendering/useQueryState':       lazy(() => import('./routes/conditional-rendering.useQueryState')),
  '/conditional-rendering/useQueryStates':      lazy(() => import('./routes/conditional-rendering.useQueryStates')),
  '/form/useQueryState':                        lazy(() => import('./routes/form.useQueryState')),
  '/form/useQueryStates':                       lazy(() => import('./routes/form.useQueryStates')),
  '/hash-preservation':                         lazy(() => import('./routes/hash-preservation')),
  '/json':                                      lazy(() => import('./routes/json')),
  '/life-and-death':                            lazy(() => import('./routes/life-and-death')),
  '/linking/useQueryState':                     lazy(() => import('./routes/linking.useQueryState')),
  '/linking/useQueryState/other':               lazy(() => import('./routes/linking.useQueryState.other')),
  '/linking/useQueryStates':                    lazy(() => import('./routes/linking.useQueryStates')),
  '/linking/useQueryStates/other':              lazy(() => import('./routes/linking.useQueryStates.other')),
  '/native-array':                              lazy(() => import('./routes/native-array')),
  '/pretty-urls':                               lazy(() => import('./routes/pretty-urls')),
  '/referential-stability/useQueryState':       lazy(() => import('./routes/referential-stability.useQueryState')),
  '/referential-stability/useQueryStates':      lazy(() => import('./routes/referential-stability.useQueryStates')),
  '/routing/useQueryState':                     lazy(() => import('./routes/routing.useQueryState')),
  '/routing/useQueryState/other':               lazy(() => import('./routes/routing.useQueryState.other')),
  '/routing/useQueryStates':                    lazy(() => import('./routes/routing.useQueryStates')),
  '/routing/useQueryStates/other':              lazy(() => import('./routes/routing.useQueryStates.other')),
  '/scroll':                                    lazy(() => import('./routes/scroll')),

  // Local tests
  '/fog-of-war':                                lazy(() => import('./routes/fog-of-war._index')),
  '/fog-of-war/result':                         lazy(() => import('./routes/fog-of-war.result')),
  '/key-isolation/useQueryState':               lazy(() => import('./routes/key-isolation.useQueryState')),
  '/key-isolation/useQueryStates':              lazy(() => import('./routes/key-isolation.useQueryStates')),
  '/push/useQueryState':                        lazy(() => import('./routes/push.useQueryState')),
  '/push/useQueryStates':                       lazy(() => import('./routes/push.useQueryStates')),
  '/rate-limits':                               lazy(() => import('./routes/rate-limits')),
  '/stitching':                                 lazy(() => import('./routes/stitching')),

  // Render Count
  '/render-count/:hook/:shallow/:history/:startTransition/no-loader': lazy(() => import('./routes/render-count.$hook.$shallow.$history.$startTransition.no-loader')),

  // Reproductions
  '/repro-359':                 lazy(() => import('./routes/repro-359')),
  '/repro-982':                 lazy(() => import('./routes/repro-982')),
  '/repro-1099/useQueryState':  lazy(() => import('./routes/repro-1099.useQueryState')),
  '/repro-1099/useQueryStates': lazy(() => import('./routes/repro-1099.useQueryStates')),
}

export function ReactRouter() {
  return (
    <NuqsAdapter>
      <BrowserRouter>
        <RootLayout>
          <Suspense fallback={null}>
            <Switch>
              {Object.entries(routes).map(([path, Component]) => (
                <Route key={path} exact path={path} component={Component} />
              ))}
            </Switch>
          </Suspense>
        </RootLayout>
      </BrowserRouter>
    </NuqsAdapter>
  )
}
