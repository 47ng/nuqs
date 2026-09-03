import { useRouter as usePagesRouter } from 'next/compat/router.js'
import { useEffect, useMemo } from 'react'
import type { AdapterInterface } from '../lib/defs'
import {
  onIsolatedNavigation,
  searchParamsFromQuery,
  updatePagesUrl
} from './impl.pages'
import {
  publish,
  useIsoLayoutEffect,
  useIsolatedSearchParams,
  type BridgeStore
} from './impl.isolated'

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
  // This sets the render-phase view for hooks that mount later in this pass.
  // The ready router may reveal such a subtree, for example.
  // Those hooks would read the previous commit without it.
  store.latest = { pathname: null, searchParams }
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
