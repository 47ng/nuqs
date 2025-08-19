import { createAdapterProvider, type AdapterProvider } from '../lib/context'
import { useNuqsNextPagesRouterAdapter } from './impl.pages'

export const NuqsAdapter: AdapterProvider = createAdapterProvider(
  useNuqsNextPagesRouterAdapter
)
