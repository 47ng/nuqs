import { createElement, Suspense, type ReactNode } from 'react'
import { createAdapterProvider } from '../lib/context'
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'

const Provider = createAdapterProvider(useNuqsNextAppRouterAdapter)

export function NuqsAdapter({ children }: { children: ReactNode }) {
  return createElement(Provider, {
    children: [
      createElement(Suspense, {
        key: 'nuqs-adapter-suspense-navspy',
        children: createElement(NavigationSpy)
      }),
      children
    ]
  })
}
