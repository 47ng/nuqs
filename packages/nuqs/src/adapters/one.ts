import { useActiveParams, useRouter } from 'one'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

function useNuqsOneAdapter() {
  const router = useRouter()
  const searchParams = new URLSearchParams(useActiveParams() as {})
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    if (options.history === 'push') {
      router.push(renderQueryString(search), {
        scroll: options.scroll
      })
    } else {
      router.replace(renderQueryString(search), {
        scroll: options.scroll
      })
    }
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsOneAdapter)
