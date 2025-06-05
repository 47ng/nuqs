import { createAdapterProvider, type AdapterProvider } from '../lib/context'
import { useNuqsNextAppRouterAdapter } from './impl.app'

export const NuqsAdapter: AdapterProvider = createAdapterProvider(
  useNuqsNextAppRouterAdapter
)
