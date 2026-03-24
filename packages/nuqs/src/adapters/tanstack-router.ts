import { useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react'
import { silentResetQueues } from '../lib/queues/reset'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

let lastRenderedLocation =
  typeof location === 'undefined'
    ? { pathname: '', search: '' }
    : { pathname: location.pathname, search: location.search }

let inheritedSearchContext: {
  pathname: string
  previousSearch: string
  inheritedSearch: string
} | null = null

function useNuqsTanstackRouterAdapter(watchKeys: string[]): AdapterInterface {
  const pathname = useLocation({ select: state => state.pathname })
  const { navigate } = useRouter()
  const currentSearch = typeof location === 'undefined' ? '' : location.search
  const instanceLocation = useRef({ pathname, search: currentSearch })
  const hasPathnameChanged = pathname !== lastRenderedLocation.pathname
  if (hasPathnameChanged) {
    inheritedSearchContext = {
      pathname,
      previousSearch: lastRenderedLocation.search,
      inheritedSearch: currentSearch
    }
    silentResetQueues()
  } else if (currentSearch !== lastRenderedLocation.search) {
    inheritedSearchContext = null
  }
  lastRenderedLocation = {
    pathname,
    search: currentSearch
  }
  const isStaleInstance = pathname !== instanceLocation.current.pathname
  const inheritedSearchKeys =
    inheritedSearchContext?.pathname === pathname &&
    inheritedSearchContext.inheritedSearch === currentSearch
      ? findInheritedSearchKeys(
          inheritedSearchContext.previousSearch,
          currentSearch,
          watchKeys
        )
      : []
  // Use useRouterState instead of useLocation so that structuralSharing
  // is forwarded, stabilizing object references when search values
  // haven't changed. Prevents infinite re-renders with viewport preloading.
  // See https://github.com/47ng/nuqs/issues/1363
  const search = useRouterState({
    select: state =>
      Object.fromEntries(
        Object.entries(state.location.search).filter(([key]) =>
          watchKeys.includes(key)
        )
      ) as Record<string, string | string[]>,
    structuralSharing: true
  })
  const searchParams = useMemo(() => {
    if (isStaleInstance) {
      return pickSearchParams(instanceLocation.current.search, watchKeys)
    }
    const searchParams = new URLSearchParams(
      Object.entries(search).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => [key, v])
        }
        if (typeof value === 'object' && value !== null) {
          return [[key, JSON.stringify(value)]]
        }
        return [[key, value]]
      })
    )
    inheritedSearchKeys.forEach(key => {
      searchParams.delete(key)
    })
    return searchParams
  }, [
    inheritedSearchKeys.join(','),
    isStaleInstance,
    search,
    watchKeys.join(',')
  ])

  useEffect(() => {
    instanceLocation.current = {
      pathname,
      search: currentSearch
    }
  }, [currentSearch, pathname])

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      // startTransition is necessary to support scroll restoration
      startTransition(() => {
        navigate({
          // We use `to` with the full path instead of `search` to avoid
          // requiring userland stitching of nuqs definitions to TSR route
          // declarations, and to support custom URL encoding.
          // Also avoids TSR appending a trailing slash (#1215).
          from: '/',
          to: pathname + renderQueryString(search),
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          hash: prevHash => prevHash ?? '',
          state: state => state
        })
      })
    },
    [navigate, pathname]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1
  }
}

export const NuqsAdapter: AdapterProvider = createAdapterProvider(
  useNuqsTanstackRouterAdapter
)

function findInheritedSearchKeys(
  previousSearch: string,
  nextSearch: string,
  watchKeys: string[]
): string[] {
  if (!previousSearch.length || !nextSearch.length || watchKeys.length === 0) {
    return []
  }
  const previous = new URLSearchParams(previousSearch)
  const next = new URLSearchParams(nextSearch)
  return watchKeys.filter(key => haveSameSearchValues(previous, next, key))
}

function haveSameSearchValues(
  previous: URLSearchParams,
  next: URLSearchParams,
  key: string
): boolean {
  const previousValues = previous.getAll(key)
  if (previousValues.length === 0) {
    return false
  }
  const nextValues = next.getAll(key)
  return (
    previousValues.length === nextValues.length &&
    previousValues.every((value, index) => nextValues[index] === value)
  )
}

function pickSearchParams(
  search: string,
  watchKeys: string[]
): URLSearchParams {
  const source = new URLSearchParams(search)
  const searchParams = new URLSearchParams()
  watchKeys.forEach(key => {
    source.getAll(key).forEach(value => {
      searchParams.append(key, value)
    })
  })
  return searchParams
}
