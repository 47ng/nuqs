import { useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react'
import { resetQueues } from '../lib/queues/reset'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

// Must stay serializable (string | string[]) to satisfy the type constraint
// of `structuralSharing: true` on the search selector below — see #1363.
type SearchRecord = Record<string, string | string[]>

function onPopState() {
  resetQueues()
}

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
  const { navigate } = router

  useEffect(() => {
    const unsubscribe = router.history.subscribe(
      ({ action }: HistorySubscriberArgs) => {
        if (
          action.type === 'BACK' ||
          action.type === 'FORWARD' ||
          action.type === 'GO'
        ) {
          resetQueues()
        }
      }
    )
    window.addEventListener('popstate', onPopState)
    return () => {
      unsubscribe()
      window.removeEventListener('popstate', onPopState)
    }
  }, [router.history])

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
        navigate({
          // I know the docs say to use `search` here, but it would require
          // userland code to stitch the nuqs definitions to the route declarations
          // in order for TSR to serialize them, which kind of breaks the
          // "works out of the box" promise, and it also wouldn't support
          // the custom URL encoding.
          // TBC if it causes issues with consuming those search params
          // in other parts of the app.
          //
          // Note: we need to specify pathname + search here to avoid TSR appending
          // a trailing slash to the pathname, see https://github.com/47ng/nuqs/issues/1215
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
