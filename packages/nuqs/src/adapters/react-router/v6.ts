import { useNavigate, useSearchParams } from 'react-router-dom'
import { renderQueryString } from '../../url-encoding'
import type { AdapterOptions } from '../defs'
import { createAdapterProvider } from '../internal.context'

function useNuqsReactRouterV6Adapter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    navigate(
      {
        search: renderQueryString(search)
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
