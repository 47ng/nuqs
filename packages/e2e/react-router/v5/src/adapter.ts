import {
  type unstable_AdapterInterface as AdapterInterface,
  unstable_createAdapterProvider as createAdapterProvider,
  renderQueryString,
  type unstable_UpdateUrlFunction as UpdateUrlFunction
} from 'nuqs/adapters/custom'
import { useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

function useNuqsReactRouterV5Adapter(): AdapterInterface {
  // todo: Shallow (using the History API)
  // todo: Key isolation
  const history = useHistory()
  const location = useLocation()
  const searchParams = useMemo(() => {
    return new URLSearchParams(location.search)
  }, [location.search])

  const updateUrl = useCallback<UpdateUrlFunction>(
    (search, options) => {
      const queryString = renderQueryString(search)
      if (options.history === 'push') {
        history.push({
          search: queryString,
          hash: window.location.hash
        })
      } else {
        history.replace({
          search: queryString,
          hash: window.location.hash
        })
      }
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
    },
    [history.push, history.replace]
  )
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactRouterV5Adapter)
