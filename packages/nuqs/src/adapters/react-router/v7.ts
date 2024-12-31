import { useNavigate, useSearchParams } from 'react-router'
import { createAdapterProvider } from '../lib/context'
import { createReactRouterBasedAdapter } from '../lib/react-router'

const {
  enableHistorySync,
  useNuqsReactRouterBasedAdapter: useNuqsReactRouterV7Adapter,
  useOptimisticSearchParams
} = createReactRouterBasedAdapter(
  'react-router-v7',
  useNavigate,
  useSearchParams
)

export { useOptimisticSearchParams }

export const NuqsAdapter = createAdapterProvider(useNuqsReactRouterV7Adapter)

enableHistorySync()
