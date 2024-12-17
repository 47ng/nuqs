import { useNavigate, useSearchParams } from 'react-router-dom'
import { renderQueryString } from '../../url-encoding'
import { createAdapterProvider } from '../lib/context'
import type { AdapterOptions } from '../lib/defs'

function useNuqsReactRouterV6Adapter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    navigate(
      {
        search: renderQueryString(search),
        hash: location.hash
      },
      {
        replace: options.history === 'replace',
        preventScrollReset: !options.scroll
      }
    )
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactRouterV6Adapter)
