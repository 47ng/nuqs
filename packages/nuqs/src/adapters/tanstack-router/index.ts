import { createAdapterProvider } from '../lib/context'
import { useNuqsTanstackRouterAdapter } from './impl'

export const NuqsAdapter = createAdapterProvider(useNuqsTanstackRouterAdapter)
