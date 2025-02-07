import { createAdapterProvider } from '../lib/context'
import { useNuqsNextPagesRouterAdapter } from './impl.pages'

export const NuqsAdapter = createAdapterProvider(useNuqsNextPagesRouterAdapter)
