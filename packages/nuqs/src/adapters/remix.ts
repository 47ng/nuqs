import { useSearchParams } from '@remix-run/react'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

function useNuqsRemixAdapter() {
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

export const NuqsAdapter = createAdapterProvider(useNuqsRemixAdapter)
