import { useNavigate, useSearchParams } from 'react-router-dom'
import { createAdapterProvider } from '../lib/context'
import { createReactRouterBasedAdapter } from '../lib/react-router'

const {
  enableHistorySync,
  useNuqsReactRouterBasedAdapter: useNuqsReactRouterV6Adapter,
  useOptimisticSearchParams
} = createReactRouterBasedAdapter(
  'react-router-v6',
  useNavigate,
  useSearchParams
)

export { useOptimisticSearchParams }

export const NuqsAdapter = createAdapterProvider(useNuqsReactRouterV6Adapter)

enableHistorySync()
