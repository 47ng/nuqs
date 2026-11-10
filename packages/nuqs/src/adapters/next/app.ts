import { createElement, Suspense } from 'react'
import { createAdapterProvider, type AdapterProps } from '../lib/context'
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'

const Provider = createAdapterProvider(useNuqsNextAppRouterAdapter)

export function NuqsAdapter({
  children,
  ...adapterProps
}: AdapterProps & {
  children: React.ReactNode
}): React.ReactElement {
  return createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(Suspense, {
        key: 'nuqs-adapter-suspense-navspy',
        children: createElement(NavigationSpy)
      }),
      children
    ]
  })
}
