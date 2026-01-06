'use client'

import {
  unstable_createAdapterProvider as createAdapterProvider,
  renderQueryString,
  unstable_UpdateUrlFunction as UpdateUrlFunction
} from 'nuqs/adapters/custom'
import { useCallback } from 'react'
import { useRouter } from 'waku'

function useNuqsAdapter() {
  const { path, query, push, replace } = useRouter()
  const searchParams = new URLSearchParams(query)
  const updateUrl = useCallback<UpdateUrlFunction>(
    (search, options) => {
      const query = renderQueryString(search)
      const url = path + query + location.hash
      if (options.shallow) {
        options.history === 'push'
          ? history.pushState(null, '', url)
          : history.replaceState(null, '', url)
      } else {
        const updateMethod = options.history === 'push' ? push : replace
        // bypass waku's typesafe route check by using `as never`
        updateMethod(url as never)
      }
      // Waku router does not scroll unless the pathname changes
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
    },
    [path, push, replace]
  )
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsAdapter)
