import { useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { startTransition, useCallback, useMemo, useRef } from 'react'
import { silentResetQueues } from '../lib/queues/reset'
import { globalThrottleQueue } from '../lib/queues/throttle'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

// Module-level so a fresh mount on a new route still detects the change.
let lastSeenPathname = typeof location !== 'undefined' ? location.pathname : ''
let lastSeenSearch = typeof location !== 'undefined' ? location.search : ''


function useNuqsTanstackRouterAdapter(watchKeys: string[]): AdapterInterface {
  const pathname = useLocation({ select: state => state.pathname })
  const { navigate } = useRouter()
  // Fresh mounts (the new route) unfreeze so their pushes go through.
  const isFreshMount = useRef(true)
  if (isFreshMount.current) {
    isFreshMount.current = false
    globalThrottleQueue.frozen = false
  }
  if (pathname !== lastSeenPathname) {
    const searchFromPreviousRoute = lastSeenSearch
    lastSeenPathname = pathname
    globalThrottleQueue.frozen = true
    silentResetQueues()
    // After the render commits, strip stale search params carried over by
    // TanStack Router's <Link>. Only strip if the search params match the
    // previous route's (i.e., they were carried over, not set by the link).
    setTimeout(() => {
      globalThrottleQueue.frozen = false
      if (
        typeof location !== 'undefined' &&
        searchFromPreviousRoute &&
        location.search === searchFromPreviousRoute
      ) {
        const url = new URL(location.href)
        url.search = ''
        history.replaceState(history.state, '', url.href)
      }
    }, 0)
  }
  // Side-effect during render: track search for the stale-param comparison
  // on the next pathname change. Module-level, so no re-renders triggered.
  if (typeof location !== 'undefined') {
    lastSeenSearch = location.search
  }
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
  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        Object.entries(search).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => [key, v])
          }
          if (typeof value === 'object' && value !== null) {
            return [[key, JSON.stringify(value)]]
          }
          return [[key, value]]
        })
      ),
    [search, watchKeys.join(',')]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      if (globalThrottleQueue.frozen) {
        return
      }
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
