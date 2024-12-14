import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom'
import RootLayout from './layout'

// Adapt the RRv7 / Remix default export for component into a Component export for v6
function load(mod: Promise<{ default: any }>) {
  return () => mod.then(m => ({ Component: m.default }))
}

// prettier-ignore
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout/>} >,
      <Route path='hash-preservation'            lazy={load(import('./routes/hash-preservation'))} />
      <Route path='basic-io/useQueryState'       lazy={load(import('./routes/basic-io.useQueryState'))} />
      <Route path='basic-io/useQueryStates'      lazy={load(import('./routes/basic-io.useQueryStates'))} />
      <Route path='linking/useQueryState'        lazy={load(import('./routes/linking.useQueryState'))} />
      <Route path='linking/useQueryState/other'  lazy={load(import('./routes/linking.useQueryState.other'))} />
      <Route path='linking/useQueryStates'       lazy={load(import('./routes/linking.useQueryStates'))} />
      <Route path='linking/useQueryStates/other' lazy={load(import('./routes/linking.useQueryStates.other'))} />
      <Route path='push/useQueryState'           lazy={load(import('./routes/push.useQueryState'))} />
      <Route path='push/useQueryStates'          lazy={load(import('./routes/push.useQueryStates'))} />
    </Route>
  ))

export function ReactRouter() {
  return (
    <NuqsAdapter>
      <RouterProvider router={router} />
    </NuqsAdapter>
  )
}
