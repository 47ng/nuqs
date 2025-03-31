import { useRouter, useRouterState } from '@tanstack/react-router'
import { startTransition, useCallback, useMemo } from 'react'
import { createAdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

function useNuqsTanstackRouterAdapter(): AdapterInterface {
  const state = useRouterState()
  const router = useRouter()

  const search = useMemo(
    () => new URLSearchParams(state.location.search || ''),
    [state.location.search]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      startTransition(() => {
        const url = renderURL(location.pathname, search)
        router.navigate({
          from: state.location.pathname,
          to: url,
          search: search,
          replace: options.history === 'replace',
          resetScroll: options.scroll
        })
      })
    },
    [router.navigate]
  )

  return {
    searchParams: search,
    updateUrl,
    rateLimitFactor: 1
  }
}

function renderURL(pathname: string, search: URLSearchParams) {
  const hashlessBase = pathname.split('#')[0] ?? ''
  const query = search.toString() ? `?${search.toString()}` : ''
  const hash = location.hash
  return hashlessBase + query + hash
}

export const NuqsAdapter = createAdapterProvider(useNuqsTanstackRouterAdapter)
