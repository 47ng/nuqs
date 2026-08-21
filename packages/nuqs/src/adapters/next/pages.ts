import { createElement } from 'react'
import { createAdapterProvider, type AdapterProvider } from '../lib/context'
import { NavigationSpy, useNuqsNextPagesRouterAdapter } from './impl.pages'

const Provider = createAdapterProvider(useNuqsNextPagesRouterAdapter)

export const NuqsAdapter: AdapterProvider = ({ children, ...adapterProps }) =>
  createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(NavigationSpy, { key: 'nuqs-adapter-navigation-spy' }),
      children
    ]
  }) as ReturnType<AdapterProvider>
