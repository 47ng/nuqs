import { createAdapterProvider } from '../internal.context'
import { useNuqsNextAppRouterAdapter } from './impl.app'

export const NuqsAdapter = createAdapterProvider(useNuqsNextAppRouterAdapter)
