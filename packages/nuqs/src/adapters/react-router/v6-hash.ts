import { useSearchParams } from 'react-router-dom'
import type { AdapterProvider } from '../lib/context'
import { createHashRouterBasedAdapter } from '../lib/hash-router'

const adapter = createHashRouterBasedAdapter({
  adapter: 'react-router-v6-hash',
  useSearchParams
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
