import {
  createElement,
  Suspense,
  type ReactElement,
  type ReactNode
} from 'react'
import { createAdapterProvider, type AdapterProps } from '../lib/context'
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'

const Provider = createAdapterProvider(useNuqsNextAppRouterAdapter)

export function NuqsAdapter({
  children,
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
}): ReactElement {
  // @ts-expect-error AdapterProvider expects children in its props type,
  // but we pass them as the third argument to createElement, not via props.
  return createElement(Provider, adapterProps, [
    createElement(Suspense, {
      key: 'nuqs-adapter-suspense-navspy',
      children: createElement(NavigationSpy)
    }),
    children
  ])
}
