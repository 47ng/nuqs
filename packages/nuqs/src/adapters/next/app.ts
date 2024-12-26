'use client'

import { createAdapterProvider } from '../lib/context'
import { useNuqsNextAppRouterAdapter } from './impl.app'

export const NuqsAdapter = createAdapterProvider(useNuqsNextAppRouterAdapter)
