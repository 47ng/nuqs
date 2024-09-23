import { createAdapterProvider } from '../internal.context'
import { useNuqsNextPagesRouterAdapter } from './impl.pages'

export const NuqsAdapter = createAdapterProvider(useNuqsNextPagesRouterAdapter)
