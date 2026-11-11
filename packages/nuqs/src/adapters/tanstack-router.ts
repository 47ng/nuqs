import { useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import {
  createElement,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import { resetQueues } from '../lib/queues/reset'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

// Must stay serializable (string | string[]) to satisfy the type constraint
// of `structuralSharing: true` on the search selector below — see #1363.
type SearchRecord = Record<string, string | string[]>

type HistorySubscriberArgs = {
  action: {
    type: 'PUSH' | 'REPLACE' | 'BACK' | 'FORWARD' | 'GO'
  }
}

function useNuqsTanstackRouterAdapter(watchKeys: string[]): AdapterInterface {
  const pathname = useLocation({ select: state => state.pathname })
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
      ) as SearchRecord,
    structuralSharing: true
  })
  // `location` flips to the destination optimistically at the start of a
  // navigation, while `resolvedLocation` stays on the committed route until
  // the transition settles. During a cross-page transition (e.g. a delayed
  // loader, or `defaultPendingMs: 0`), the outgoing page is still mounted but
  // would otherwise read the destination's search params.
  // See https://github.com/47ng/nuqs/issues/1433 (and #1293, #1156)
  const resolvedPathname = useRouterState({
    select: state => state.resolvedLocation?.pathname ?? state.location.pathname
  })
  const router = useRouter()

  // Track which pathname this hook instance was mounted under to
  // keep its last stable search during cross-page transitions.
  const ownedPathnameRef = useRef(pathname)
  // Cache the last stable search for the owned pathname so we don't
  // leak destination params while the source is still mounted.
  const cachedSearchRef = useRef<SearchRecord>(search)

  // Keep per-hook search stable during cross-page transitions
  // to avoid leaking destination params before unmount.
  const isPathStable = pathname === resolvedPathname
  if (isPathStable) {
    ownedPathnameRef.current = pathname
    cachedSearchRef.current = search
  }
  const shouldUseCachedSearch =
    !isPathStable && ownedPathnameRef.current !== pathname
  const activeSearch = shouldUseCachedSearch ? cachedSearchRef.current : search
  const searchParams = useMemo(
    () =>
      // search is a Record<string, string | number | object | Array<string | number>>,
      // so we need to flatten it into a list of key/value pairs,
      // replicating keys that have multiple values before passing it
      // to URLSearchParams, otherwise { foo: ['bar', 'baz'] }
      // ends up as { foo → 'bar,baz' } instead of { foo → 'bar', foo → 'baz' }
      new URLSearchParams(
        Object.entries(activeSearch).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => [key, v])
          } else if (typeof value === 'object' && value !== null) {
            // TSR JSON.parses objects in the search params,
            // but parseAsJson expects a JSON string,
            // so we need to re-stringify it first.
            return [[key, JSON.stringify(value)]]
          } else {
            return [[key, value]]
          }
        })
      ),
    [activeSearch, watchKeys.join(',')]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      // Wrapping in a startTransition seems to be necessary
      // to support scroll restoration
      startTransition(() => {
        // We don't use `navigate` here: TSR would either re-serialize the
        // search params with its own encoder (losing nuqs' custom URL
        // encoding), or, when passing `pathname + searchString` as `to`,
        // resolve the whole string as a pathname. On routes with a dynamic
        // segment, that glued string still matches the route, and TSR then
        // appends the route's `validateSearch` defaults, resulting in a
        // second query string. See https://github.com/47ng/nuqs/issues/1590
        // (and https://github.com/47ng/nuqs/issues/1215 for trailing slashes).
        const url = pathname + renderQueryString(search) + window.location.hash
        const state = router.history.location.state
        if (options.history === 'replace') {
          router.history.replace(url, state)
        } else {
          router.history.push(url, state)
        }
        if (options.scroll) {
          window.scrollTo({ top: 0 })
        }
      })
    },
    [router, pathname]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1
  }
}

const Provider = createAdapterProvider(useNuqsTanstackRouterAdapter)

function HistorySpy() {
  const router = useRouter()

  useEffect(() => {
    return router.history.subscribe(({ action }: HistorySubscriberArgs) => {
      if (
        action.type === 'BACK' ||
        action.type === 'FORWARD' ||
        action.type === 'GO'
      ) {
        resetQueues()
      }
    })
  }, [router.history])

  return null
}

export const NuqsAdapter: AdapterProvider = ({ children, ...adapterProps }) =>
  createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(HistorySpy, { key: 'nuqs-adapter-history-spy' }),
      children
    ]
  }) as ReturnType<AdapterProvider>
