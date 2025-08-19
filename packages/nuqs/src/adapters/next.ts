import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface } from './lib/defs'
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
    },
    autoResetQueueOnUpdate: false
  }
}

export const NuqsAdapter: AdapterProvider =
  createAdapterProvider(useNuqsNextAdapter)
