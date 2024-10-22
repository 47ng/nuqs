import type { AdapterInterface } from './defs'
import { createAdapterProvider } from './internal.context'
import { useNuqsNextAppRouterAdapter } from './next/impl.app'
import { isPagesRouter, useNuqsNextPagesRouterAdapter } from './next/impl.pages'

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
    }
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsNextAdapter)
