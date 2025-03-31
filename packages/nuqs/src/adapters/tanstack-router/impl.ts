import { useRouterState } from '@tanstack/react-router'
import { startTransition, useCallback, useMemo, useOptimistic } from 'react'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'

export function useNuqsTanstackRouterAdapter(): AdapterInterface {
  const state = useRouterState()
  const search = useMemo(
    () => new URLSearchParams(state.location.search || ''),
    [state.location.search]
  )
  const [optimisticSearchParams, setOptimisticSearchParams] =
    useOptimistic<URLSearchParams>(search)

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      startTransition(() => {
        if (!options.shallow) {
          setOptimisticSearchParams(search)
        }
        const url = renderURL(location.origin + location.pathname, search)
        const updateMethod =
          options.history === 'push' ? history.pushState : history.replaceState
        updateMethod.call(history, null, '', url)
        if (options.scroll) {
          window.scrollTo(0, 0)
        }
      })
    },
    [setOptimisticSearchParams]
  )

  return {
    searchParams: optimisticSearchParams,
    updateUrl,
    rateLimitFactor: 2
  }
}

function renderURL(base: string, search: URLSearchParams) {
  const hashlessBase = base.split('#')[0] ?? ''
  const query = search.toString() ? `?${search.toString()}` : ''
  const hash = location.hash
  return hashlessBase + query + hash
}
