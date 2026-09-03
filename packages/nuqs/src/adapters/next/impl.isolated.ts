import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore
} from 'react'
import { compareQuery } from '../../lib/compare'
import { createEmitter, type Emitter } from '../../lib/emitter'
import { filterSearchParams } from '../lib/key-isolation'

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
  committedPathname: string | null
  // latest is the Bridge's render-phase view.
  // Hooks read it only before commit when they mount before the Bridge.
  // pathname is app's transition target; pages has none, so stores null.
  latest: { pathname: string | null; searchParams: URLSearchParams } | null
  emitter: Emitter<Record<string, undefined>>
  // Reference counts of watched keys, so the first publish can notify
  // subscribers of keys absent from the published params.
  watched: Map<string, number>
}

export function createBridgeStore(): BridgeStore {
  return {
    committed: null,
    committedPathname: null,
    latest: null,
    emitter: createEmitter(),
    watched: new Map()
  }
}

// Callers call publish only from layout effects at commit time.
// Publish never writes discarded render params to store.committed.
// This keeps the pathname gate (#1293/#1273) correct.
// Committed params and pathname both lag to the same commit.
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

export const emptySearchParams: URLSearchParams = new URLSearchParams()

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

export const useIsoLayoutEffect: typeof useLayoutEffect =
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
      const latest = store.latest
      // The Bridge's render view beats committed params until the store commits them.
      // In the Pages router, no pathname exists, so the view always wins.
      // The Bridge renders before hooks in one top-down pass.
      // In the App router, the view wins only across a pathname change.
      // On the committed path, it may come from a discarded render.
      // The pathname cannot distinguish that from a same-route transition.
      // Committed wins there; the hook catches up when the Bridge publishes.
      const source =
        !hasCommitted.current &&
        latest !== null &&
        (pathname === undefined ||
          (latest.pathname === pathname &&
            store.committedPathname !== pathname))
          ? latest.searchParams
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
