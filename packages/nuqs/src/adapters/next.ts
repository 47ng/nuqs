import { useRouter } from 'next/compat/router.js'
import { createElement, Suspense } from 'react'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface } from './lib/defs'
import {
  NavigationSpy as AppRouterNavigationSpy,
  useNuqsNextAppRouterAdapter
} from './next/impl.app'
import {
  isPagesRouter,
  NavigationSpy as PagesRouterNavigationSpy,
  useNuqsNextPagesRouterAdapter
} from './next/impl.pages'

function useNuqsNextAdapter(): AdapterInterface {
  const pagesRouterImpl = useNuqsNextPagesRouterAdapter()
  const appRouterImpl = useNuqsNextAppRouterAdapter()
  return {
    searchParams: appRouterImpl.searchParams,
    updateUrl(search, options) {
      if (isPagesRouter()) {
        return pagesRouterImpl.updateUrl(search, options)
      } else {
        return appRouterImpl.updateUrl(search, options)
      }
    },
    autoResetQueueOnUpdate: false
  }
}

function NavigationSpy() {
  const pagesRouter = useRouter()
  const Spy = pagesRouter ? PagesRouterNavigationSpy : AppRouterNavigationSpy
  return createElement(Suspense, { fallback: null }, createElement(Spy))
}

const Provider = createAdapterProvider(useNuqsNextAdapter)

export const NuqsAdapter: AdapterProvider = ({ children, ...adapterProps }) =>
  createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(NavigationSpy, { key: 'nuqs-adapter-navigation-spy' }),
      children
    ]
  }) as ReturnType<AdapterProvider>
