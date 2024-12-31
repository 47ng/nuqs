import { useNavigate, useSearchParams } from '@remix-run/react'
import { createAdapterProvider } from './lib/context'
import { createReactRouterBasedAdapter } from './lib/react-router'

const {
  enableHistorySync,
  useNuqsReactRouterBasedAdapter: useNuqsRemixAdapter,
  useOptimisticSearchParams
} = createReactRouterBasedAdapter('remix', useNavigate, useSearchParams)

export { useOptimisticSearchParams }

export const NuqsAdapter = createAdapterProvider(useNuqsRemixAdapter)

enableHistorySync()
