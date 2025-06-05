import { useNavigate, useSearchParams } from 'react-router-dom'
import type { AdapterProvider } from '../lib/context'
import { createReactRouterBasedAdapter } from '../lib/react-router'

const adapter = createReactRouterBasedAdapter({
  adapter: 'react-router-v6',
  useNavigate,
  useSearchParams
})

export const NuqsAdapter: AdapterProvider = adapter.NuqsAdapter
export const useOptimisticSearchParams: () => URLSearchParams =
  adapter.useOptimisticSearchParams
