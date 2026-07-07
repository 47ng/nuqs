import { useRouter as usePagesRouter } from 'next/compat/router.js'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from 'react'
import { compareQuery } from '../../lib/compare'
import { debug } from '../../lib/debug'
import { createEmitter, type Emitter } from '../../lib/emitter'
import { setQueueResetMutex } from '../../lib/queues/reset'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'
import { filterSearchParams } from '../lib/key-isolation'
import { historyUpdateMarker } from '../lib/patch-history'
import { NUM_HISTORY_CALLS_PER_UPDATE, renderURL } from './impl.app'
import {
  onIsolatedNavigation,
  searchParamsFromQuery,
  updatePagesUrl
} from './impl.pages'

// Experimental per-key isolation (behind `experimental_keyIsolation`).
//
// Next.js contexts have no per-consumer bailout: any search param change
// re-renders every useSearchParams (app) / useRouter (pages) call site.
// Under the flag, a single Bridge component per adapter instance is the sole
// consumer of those contexts, and publishes the committed search params into
// this store; hooks subscribe per watched key and read filtered,
// identity-cached snapshots.
export type BridgeStore = {
  committed: URLSearchParams | null
  // Render-phase view from the Bridge: the transition-aware destination
  // pathname and its search params. Consulted only for a hook's pre-commit
  // snapshots (mounted mid-transition, before the Bridge commits).
  latest: { pathname: string; searchParams: URLSearchParams } | null
  emitter: Emitter<Record<string, undefined>>
  // Reference counts of watched keys, so the first publish can notify
  // subscribers of keys absent from the published params.
  watched: Map<string, number>
  replace: ReturnType<typeof useRouter>['replace'] | null
}

export function createBridgeStore(): BridgeStore {
  return {
    committed: null,
    latest: null,
    emitter: createEmitter(),
    watched: new Map(),
    replace: null
  }
}

// Called from layout effects only (commit time): the store never exposes
// values from renders React may discard, which is what keeps the pathname
// gate (#1293/#1273) semantics intact — committed params and pathname both
// lag to the same commit.
export function publish(store: BridgeStore, next: URLSearchParams): void {
  // The render-phase holder is only trustworthy within the render pass that
  // wrote it: every Bridge commit invalidates it.
  store.latest = null
  const previous = store.committed
  if (previous === next) {
    return
  }
  store.committed = next
  if (previous === null) {
    // First publish: notify every present AND watched key. Hooks may have
    // mounted before the (Suspense-deferred) Bridge, reading the live
    // location fallback — a watched key removed from the URL in that window
    // is absent from `next` but still needs its subscribers re-checked.
    // Equal values bail on the per-hook snapshot cache, so this is cheap.
    for (const key of new Set([...next.keys(), ...store.watched.keys()])) {
      store.emitter.emit(key)
    }
    return
  }
  const keys = new Set([...previous.keys(), ...next.keys()])
  for (const key of keys) {
    if (!compareQuery(previous.getAll(key), next.getAll(key))) {
      store.emitter.emit(key)
    }
  }
}

const emptySearchParams = new URLSearchParams()

export function useWarnOnFlagToggle(
  latched: boolean,
  current: boolean | undefined
): void {
  const warned = useRef(false)
  if (
    process.env.NODE_ENV !== 'production' &&
    !warned.current &&
    latched !== (current ?? false)
  ) {
    warned.current = true
    console.warn(
      '[nuqs] `experimental_keyIsolation` cannot be toggled at runtime, keeping its initial value (%s).',
      latched
    )
  }
}

// Env-constant aliases: the server and client fibers never share hook lists,
// so conditioning on the environment (not on renders) is hook-order-safe.
const useServerSearchParams: () => URLSearchParams | null =
  typeof window === 'undefined'
    ? (useSearchParams as unknown as () => URLSearchParams | null)
    : () => null

const useIsoLayoutEffect =
  typeof window === 'undefined' ? () => {} : useLayoutEffect

type IsolatedSearchParamsOptions = {
  pathname?: string | null
  serverSearchParams?: URLSearchParams | null
}

export function useIsolatedSearchParams(
  store: BridgeStore,
  watchKeys: string[],
  { pathname, serverSearchParams }: IsolatedSearchParamsOptions
): URLSearchParams {
  // Return a referentially-stable snapshot while the watched keys are
  // unchanged: required by useSyncExternalStore (Object.is bail-out), and it
  // preserves key isolation (a change to an unwatched key keeps the same ref).
  const cache = useRef<{ key: string; search: URLSearchParams } | null>(null)
  const select = (source: URLSearchParams): URLSearchParams => {
    // copy: true is required: the source may be Next's ReadonlyURLSearchParams
    // (which throws on delete), or the shared store value.
    const filtered = filterSearchParams(source, watchKeys, true)
    const key = filtered.toString()
    if (cache.current?.key === key) {
      return cache.current.search
    }
    cache.current = { key, search: filtered }
    return filtered
  }
  const subscribe = useCallback(
    (callback: () => void) => {
      const off = watchKeys.map(key => {
        store.watched.set(key, (store.watched.get(key) ?? 0) + 1)
        return store.emitter.on(key, callback)
      })
      return () => {
        watchKeys.forEach(key => {
          const count = store.watched.get(key) ?? 0
          if (count <= 1) {
            store.watched.delete(key)
          } else {
            store.watched.set(key, count - 1)
          }
        })
        off.forEach(unsubscribe => unsubscribe())
      }
    },
    [watchKeys, store]
  )
  // Flipped at commit (not keyed on the snapshot cache): pre-commit snapshots
  // keep a single source across repeated render passes (StrictMode double
  // render, discarded then replayed transitions), preserving getSnapshot
  // consistency between consecutive calls.
  const hasCommitted = useRef(false)
  useEffect(() => {
    hasCommitted.current = true
  }, [])
  return useSyncExternalStore(
    subscribe,
    () => {
      const source =
        !hasCommitted.current &&
        pathname != null &&
        store.latest !== null &&
        store.latest.pathname === pathname
          ? // Pre-commit snapshot of a hook mounted mid-transition: the
            // Bridge's render-phase view is destination-consistent when
            // pathnames match, while `committed` may still hold the
            // previous route.
            store.latest.searchParams
          : (store.committed ?? new URLSearchParams(location.search))
      return select(source)
    },
    () =>
      select(
        serverSearchParams ??
          store.committed ??
          (typeof location === 'undefined'
            ? emptySearchParams
            : // Hydration render: the request URL equals location.search,
              // matching what the server alias rendered.
              new URLSearchParams(location.search))
      )
  )
}

export function AppBridge({ store }: { store: BridgeStore }): null {
  const router = useRouter()
  store.replace = router.replace
  // The sole SearchParamsContext consumer under the flag. The `??` handles
  // the nullable compat overload for apps with a pages/ directory.
  const searchParams = (useSearchParams() ??
    emptySearchParams) as URLSearchParams
  const pathname = usePathname()
  // Render-phase ref write only — no listeners are called, so no other
  // component gets scheduled mid-render (same class as NavigationSpy's
  // render-phase queue reset).
  store.latest = { pathname, searchParams }
  useIsoLayoutEffect(() => {
    publish(store, searchParams)
  })
  return null
}

export function PagesBridge({ store }: { store: BridgeStore }): null {
  // The sole RouterContext consumer under the flag. Note: isolation on the
  // pages router additionally requires the flagged subtree to be a
  // render-stable element (see the NuqsAdapter prop docs) because Next
  // re-renders the page tree top-down on every route state change.
  const router = usePagesRouter()
  const searchParams = useMemo(
    () => searchParamsFromQuery(router?.query),
    [JSON.stringify(router?.query)]
  )
  if (store.committed === null) {
    // One-time render-phase seed: the pages router renders in tree order
    // (Bridge before children, single-pass hydration), so SSR and hydration
    // reads are seeded before any hook takes its first snapshot.
    store.committed = searchParams
  }
  useEffect(() => {
    router?.events.on('routeChangeStart', onIsolatedNavigation)
    router?.events.on('beforeHistoryChange', onIsolatedNavigation)
    return () => {
      router?.events.off('routeChangeStart', onIsolatedNavigation)
      router?.events.off('beforeHistoryChange', onIsolatedNavigation)
    }
  }, [])
  useIsoLayoutEffect(() => {
    publish(store, searchParams)
  })
  return null
}

export function useNuqsNextAppRouterIsolatedAdapter(
  store: BridgeStore,
  watchKeys: string[]
): AdapterInterface {
  // Kept per-hook: PathnameContext only changes on pathname changes, and the
  // render-time reconcile gate (#1293/#1273) needs the transition-aware
  // destination pathname.
  const pathname = usePathname()
  const serverSearchParams = useServerSearchParams()
  const searchParams = useIsolatedSearchParams(store, watchKeys, {
    pathname,
    serverSearchParams
  })
  // Same update path as the non-isolated adapter, minus useOptimistic:
  // during shallow: false RSC round-trips, hooks stay stable through the
  // pending updates overlay (autoResetQueueOnUpdate: false keeps flushed
  // entries), so the optimistic mirror is not needed here.
  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
    startTransition(() => {
      const url = renderURL(search)
      debug(20, 'next/app', url)
      const updateMethod =
        options.history === 'push' ? history.pushState : history.replaceState
      setQueueResetMutex(0)
      updateMethod.call(history, null, historyUpdateMarker, url)
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (!options.shallow) {
        store.replace!(url, {
          scroll: false
        })
      }
    })
  }, [])
  return {
    searchParams,
    pathname,
    updateUrl,
    rateLimitFactor: NUM_HISTORY_CALLS_PER_UPDATE,
    autoResetQueueOnUpdate: false
  }
}

export function useNuqsNextPagesRouterIsolatedAdapter(
  store: BridgeStore,
  watchKeys: string[]
): AdapterInterface {
  // No useRouter here (the Bridge is the sole consumer) and no pathname:
  // parity with the non-isolated pages adapter, where the reconcile gate
  // falls back to location.pathname.
  const searchParams = useIsolatedSearchParams(store, watchKeys, {})
  return {
    searchParams,
    updateUrl: updatePagesUrl,
    autoResetQueueOnUpdate: false
  }
}
