import { useSearchParams } from 'react-router-dom'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

function useNuqsReactRouterAdapter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    setSearchParams(search, {
      replace: options.history === 'replace',
      preventScrollReset: !options.scroll
    })
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactRouterAdapter)
