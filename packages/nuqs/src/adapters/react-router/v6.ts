import { createContext, useContext } from 'react'
import * as ReactRouter from 'react-router-dom'
import type { AdapterProvider } from '../lib/context'
import { createReactRouterBasedAdapter } from '../lib/react-router'

const DataRouterContext =
  ReactRouter.UNSAFE_DataRouterContext ?? createContext(null)

const adapter = createReactRouterBasedAdapter({
  adapter: 'react-router-v6',
  useNavigate: ReactRouter.useNavigate,
  useSearchParams: ReactRouter.useSearchParams,
  useRouter: () => useContext(DataRouterContext)?.router
})

export const NuqsAdapter: AdapterProvider = adapter.NuqsAdapter
export const useOptimisticSearchParams: () => URLSearchParams =
  adapter.useOptimisticSearchParams
