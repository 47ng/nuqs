import { useNavigate, useSearchParams } from '@remix-run/react'
import type { AdapterProvider } from './lib/context'
import { createReactRouterBasedAdapter } from './lib/react-router'

const adapter = createReactRouterBasedAdapter({
  adapter: 'remix',
  useNavigate,
  useSearchParams
})

export const NuqsAdapter: AdapterProvider = adapter.NuqsAdapter
export const useOptimisticSearchParams: () => URLSearchParams =
  adapter.useOptimisticSearchParams
