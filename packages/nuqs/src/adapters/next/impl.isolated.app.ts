import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import { startTransition, useCallback, useState } from 'react'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'
import {
  commitAppUrl,
  NUM_HISTORY_CALLS_PER_UPDATE,
  type AppRouterReplace
} from './impl.app'
import {
  createBridgeStore,
  emptySearchParams,
  publish,
  useIsolatedSearchParams,
  useIsoLayoutEffect,
  type BridgeStore
} from './impl.isolated'

export type AppBridgeStore = BridgeStore & {
  replace: AppRouterReplace
}

// The provider calls this hook above both the Bridge and the hooks.
// Both subtrees get replace before they render.
// A shallow: false update never races selective Bridge Suspense hydration.
// This keeps useRouter out of hooks; it costs one render per update there.
// The key-isolation e2e render counts measure that.
export function useAppBridgeStore(): AppBridgeStore {
  const router = useRouter()
  const [store] = useState<AppBridgeStore>(() => ({
    ...createBridgeStore(),
    replace: router.replace
  }))
  store.replace = router.replace
  return store
}

// Env-constant alias: the server and client fibers never share hook lists,
// so conditioning on the environment (not on renders) is hook-order-safe.
const useServerSearchParams: () => URLSearchParams | null =
  typeof window === 'undefined'
    ? (useSearchParams as unknown as () => URLSearchParams | null)
    : () => null

export function AppBridge({ store }: { store: BridgeStore }): null {
  // The sole SearchParamsContext consumer under the flag. The `??` handles
  // the nullable compat overload for apps with a pages/ directory.
  const searchParams = useSearchParams() ?? emptySearchParams
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

export function useNuqsNextAppRouterIsolatedAdapter(
  store: AppBridgeStore,
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
      commitAppUrl(search, options, store.replace)
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
