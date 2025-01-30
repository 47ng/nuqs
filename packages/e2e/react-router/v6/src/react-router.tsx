import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom'
import RootLayout from './layout'

// Adapt the RRv7 / Remix default export for component into a Component export for v6
function load(mod: Promise<{ default: any; [otherExports: string]: any }>) {
  return () =>
    mod.then(({ default: Component, ...otherExports }) => ({
      Component,
      ...otherExports
    }))
}

// prettier-ignore
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout/>} >,
      {/* Shared E2E tests */}
      <Route path='hash-preservation'                     lazy={load(import('./routes/hash-preservation'))} />
      <Route path='basic-io/useQueryState'                lazy={load(import('./routes/basic-io.useQueryState'))} />
      <Route path='basic-io/useQueryStates'               lazy={load(import('./routes/basic-io.useQueryStates'))} />
      <Route path='linking/useQueryState'                 lazy={load(import('./routes/linking.useQueryState'))} />
      <Route path='linking/useQueryState/other'           lazy={load(import('./routes/linking.useQueryState.other'))} />
      <Route path='linking/useQueryStates'                lazy={load(import('./routes/linking.useQueryStates'))} />
      <Route path='linking/useQueryStates/other'          lazy={load(import('./routes/linking.useQueryStates.other'))} />
      <Route path='push/useQueryState'                    lazy={load(import('./routes/push.useQueryState'))} />
      <Route path='push/useQueryStates'                   lazy={load(import('./routes/push.useQueryStates'))} />
      <Route path="routing/useQueryState"                 lazy={load(import('./routes/routing.useQueryState'))} />
      <Route path="routing/useQueryState/other"           lazy={load(import('./routes/routing.useQueryState.other'))} />
      <Route path="routing/useQueryStates"                lazy={load(import('./routes/routing.useQueryStates'))} />
      <Route path="routing/useQueryStates/other"          lazy={load(import('./routes/routing.useQueryStates.other'))} />
      <Route path='shallow/useQueryState'                 lazy={load(import('./routes/shallow.useQueryState'))} />
      <Route path='shallow/useQueryStates'                lazy={load(import('./routes/shallow.useQueryStates'))} />
      <Route path='loader'                                lazy={load(import('./routes/loader'))} />
      <Route path="form/useQueryState"                    lazy={load(import('./routes/form.useQueryState'))} />
      <Route path="form/useQueryStates"                   lazy={load(import('./routes/form.useQueryStates'))} />
      <Route path="referential-stability/useQueryState"   lazy={load(import('./routes/referential-stability.useQueryState'))} />
      <Route path="referential-stability/useQueryStates"  lazy={load(import('./routes/referential-stability.useQueryStates'))} />
      <Route path="conditional-rendering/useQueryState"   lazy={load(import('./routes/conditional-rendering.useQueryState'))} />
      <Route path="conditional-rendering/useQueryStates"  lazy={load(import('./routes/conditional-rendering.useQueryStates'))} />

      <Route path="render-count/:hook/:shallow/:history/:startTransition/no-loader"     lazy={load(import('./routes/render-count.$hook.$shallow.$history.$startTransition.no-loader'))} />
      <Route path="render-count/:hook/:shallow/:history/:startTransition/sync-loader"   lazy={load(import('./routes/render-count.$hook.$shallow.$history.$startTransition.sync-loader'))} />
      <Route path="render-count/:hook/:shallow/:history/:startTransition/async-loader"  lazy={load(import('./routes/render-count.$hook.$shallow.$history.$startTransition.async-loader'))} />

      {/* Reproductions */}
      <Route path='repro-839'   lazy={load(import('./routes/repro-839'))} />
    </Route>
  ))

export function ReactRouter() {
  return (
    <NuqsAdapter>
      <RouterProvider router={router} />
    </NuqsAdapter>
  )
}
