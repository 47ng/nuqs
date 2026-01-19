import { useSearchParams } from 'react-router-dom'
import type { AdapterProvider } from '../lib/context'
import { createReactRouterBasedAdapter } from '../lib/react-router'

const adapter = createReactRouterBasedAdapter({
  adapter: 'react-router-v6-hash',
  useSearchParams,
  mode: 'hash'
  // Note: useNavigate is not needed for hash mode since hash is never sent to server
})

/**
 * Adapter provider for React Router v6 HashRouter.
 *
 * Wrap your RouterProvider with this component to enable nuqs query state management
 * in applications using HashRouter (createHashRouter or <HashRouter>).
 *
 * @example
 * ```tsx
 * import { NuqsAdapter } from 'nuqs/adapters/react-router/v6-hash'
 * import { createHashRouter, RouterProvider } from 'react-router-dom'
 *
 * const router = createHashRouter([...])
 *
 * export function App() {
 *   return (
 *     <NuqsAdapter>
 *       <RouterProvider router={router} />
 *     </NuqsAdapter>
 *   )
 * }
 * ```
 */
export const NuqsAdapter: AdapterProvider = adapter.NuqsAdapter

/**
 * Hook to access optimistic search params in HashRouter.
 *
 * Returns the current URLSearchParams from the hash fragment, with optimistic
 * updates that reflect pending state changes before they're flushed to the URL.
 *
 * @returns URLSearchParams object containing current search params from hash
 */
export const useOptimisticSearchParams: () => URLSearchParams =
  adapter.useOptimisticSearchParams
