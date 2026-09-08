import { startTransition, useCallback, useEffect, useState } from 'react'
import { debug } from '../../lib/debug'
import { setQueueResetMutex } from '../../lib/queues/reset'
import { renderQueryString } from '../../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import { applyChange, filterSearchParams } from './key-isolation'
import {
  cancelPendingNavigation,
  getHistorySyncEmitter,
  hasPendingPush,
  historyUpdateMarker,
  interruptPendingPush,
  markPendingPush,
  markPendingReplace,
  onPendingNavigationEnd,
  setPendingNavigationBlocker,
  patchHistory as applyHistoryPatch
} from './patch-history'

// Abstract away the types for the useNavigate hook from react-router-based frameworks
type NavigateUrl = {
  hash?: string
  search?: string
}
type NavigateOptions = {
  replace?: boolean
  preventScrollReset?: boolean
  state?: unknown
}
// In React Router v7+ data routers, navigate may return a Promise that
// resolves when the navigation completes (loaders included). Declarative
// routers (eg: BrowserRouter) and earlier versions return void.
type NavigateFn = (
  url: NavigateUrl,
  options: NavigateOptions
) => void | Promise<void>
type UseNavigate = () => NavigateFn
type UseSearchParams = (initial: URLSearchParams) => [URLSearchParams, {}]

// --

type DataRouter = {
  state: {
    blockers?: Map<string, { state: string; location?: unknown }>
  }
  subscribe: (listener: () => void) => () => void
  deleteBlocker: (key: string) => void
  navigate(
    to: string | NavigateUrl | number,
    options?: NavigateOptions
  ): void | Promise<void>
}

function trackRouterNavigations(router: DataRouter | undefined): void {
  if (!router) {
    return
  }
  const navigate = router.navigate
  const navigateOutsideNuqs: DataRouter['navigate'] = (to, options) => {
    if (typeof to === 'number') {
      return navigate.call(router, to, options)
    }
    const blockersBeforeNavigation = router.state.blockers
    const restorePendingPush = interruptPendingPush()
    const result = navigate.call(router, to, options)
    for (const [key, blocker] of router.state.blockers ?? []) {
      if (
        blocker.state === 'blocked' &&
        blocker !== blockersBeforeNavigation?.get(key) &&
        restorePendingPush()
      ) {
        trackRouterNavigations(router)
        const unsubscribe = subscribeToBlockerUpdatesAndRemoval(router, () => {
          const current = router.state.blockers?.get(key)
          if (
            current?.state === 'proceeding' &&
            current.location === blocker.location
          ) {
            cancelPendingNavigation()
          } else if (current?.location !== blocker.location) {
            unsubscribe()
          }
        })
        onPendingNavigationEnd(unsubscribe)
        break
      }
    }
    return result
  }
  router.navigate = navigateOutsideNuqs
  onPendingNavigationEnd(() => {
    if (router.navigate === navigateOutsideNuqs) {
      router.navigate = navigate
    }
  })
}

function trackNewNavigationBlocker(
  router: DataRouter | undefined,
  blockersBeforeNavigation: DataRouter['state']['blockers']
): void {
  if (!router) {
    return
  }
  for (const [key, blocker] of router.state.blockers ?? []) {
    if (blocker === blockersBeforeNavigation?.get(key)) {
      continue
    }
    if (blocker.state !== 'blocked') {
      continue
    }
    let didProceed = false
    const isCancelled = () =>
      !didProceed &&
      router.state.blockers?.get(key)?.location !== blocker.location
    const isAnyBlockerProceeding = () => {
      for (const current of router.state.blockers?.values() ?? []) {
        if (current.state === 'proceeding') {
          return true
        }
      }
      return false
    }
    const handleBlockerDecision = () => {
      const current = router.state.blockers?.get(key)
      didProceed ||=
        current?.state === 'proceeding' && current.location === blocker.location
      if (didProceed) {
        unsubscribe()
      } else if (isCancelled()) {
        cancelPendingNavigation()
      }
    }
    const unsubscribe = subscribeToBlockerUpdatesAndRemoval(
      router,
      handleBlockerDecision
    )
    setPendingNavigationBlocker({
      isCancelled,
      unsubscribe,
      isAnyBlockerProceeding,
      isOriginalBlockerOpen: () => router.state.blockers?.get(key) === blocker
    })
    break
  }
}

function subscribeToBlockerUpdatesAndRemoval(
  router: DataRouter,
  onChange: () => void
): () => void {
  const unsubscribe = router.subscribe(onChange)
  const deleteBlocker = router.deleteBlocker
  const removeBlocker = (key: string) => {
    deleteBlocker.call(router, key)
    onChange()
  }
  router.deleteBlocker = removeBlocker
  return () => {
    unsubscribe()
    if (router.deleteBlocker === removeBlocker) {
      router.deleteBlocker = deleteBlocker
    }
  }
}

type CreateReactRouterBasedAdapterArgs = {
  useRouter?: () => DataRouter | undefined
  adapter: string
  useNavigate: UseNavigate
  useSearchParams: UseSearchParams
}

export function createReactRouterBasedAdapter({
  adapter,
  useNavigate,
  useSearchParams,
  useRouter = () => undefined
}: CreateReactRouterBasedAdapterArgs): {
  NuqsAdapter: AdapterProvider
  useOptimisticSearchParams: () => URLSearchParams
} {
  const emitter = getHistorySyncEmitter(adapter)
  function useNuqsReactRouterBasedAdapter(
    watchKeys: string[]
  ): AdapterInterface {
    const navigate = useNavigate()
    const router = useRouter()
    const searchParams = useOptimisticSearchParams(watchKeys)
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        const url = new URL(location.href)
        url.search = renderQueryString(search)
        debug(20, adapter, url)
        const requiresRouterNavigation = options.shallow === false
        const hasUncommittedPush = hasPendingPush()
        const routerCommitsPush =
          requiresRouterNavigation &&
          (options.history === 'push' || hasUncommittedPush)
        const writeOptimisticHistory =
          options.history === 'push' && !hasUncommittedPush
            ? history.pushState
            : history.replaceState
        setQueueResetMutex(requiresRouterNavigation ? 2 : 1)
        const historyState = routerCommitsPush
          ? markPendingPush(url, hasUncommittedPush ? 'replace' : 'push')
          : history.state
        writeOptimisticHistory.call(
          history,
          historyState,
          historyUpdateMarker,
          url
        )
        let navigationPromise: Promise<void> | undefined
        if (requiresRouterNavigation) {
          if (!routerCommitsPush) {
            markPendingReplace(url)
          }
          const blockersBeforeNavigation = router?.state.blockers
          const result = navigate(
            {
              // Somehow passing the full URL object here strips the search params
              // when accessing the request.url in loaders.
              hash: url.hash,
              search: url.search
            },
            {
              replace: !routerCommitsPush,
              preventScrollReset: true,
              state: history.state?.usr
            }
          )
          trackNewNavigationBlocker(router, blockersBeforeNavigation)
          if (routerCommitsPush) {
            trackRouterNavigations(router)
          }
          // Return the router's promise; waiting for a commit can deadlock.
          if (result instanceof Promise) {
            navigationPromise = result
          }
        }
        if (options.scroll) {
          window.scrollTo(0, 0)
        }
        return navigationPromise
      },
      [navigate, router]
    )
    return {
      searchParams,
      updateUrl,
      autoResetQueueOnUpdate: false
    }
  }
  function useOptimisticSearchParams(
    watchKeys: string[] = []
  ): URLSearchParams {
    const [serverSearchParams] = useSearchParams(
      // Note: this will only be taken into account the first time the hook is called,
      // and cached for subsequent calls, causing problems when mounting components
      // after shallow updates have occurred.
      typeof location === 'undefined'
        ? new URLSearchParams()
        : new URLSearchParams(location.search)
    )
    const [searchParams, setSearchParams] = useState(() => {
      return typeof location === 'undefined'
        ? // We use this on the server to SSR with the correct search params.
          filterSearchParams(serverSearchParams, watchKeys, true)
        : // Since useSearchParams isn't reactive to shallow changes,
          // it doesn't pick up changes in the URL on mount, so we need to initialise
          // the reactive state with the current URL instead.
          filterSearchParams(
            new URLSearchParams(location.search),
            watchKeys,
            false // No need for a copy here
          )
    })
    useEffect(() => {
      function onPopState() {
        startTransition(() => {
          setSearchParams(
            applyChange(new URLSearchParams(location.search), watchKeys, false)
          )
        })
      }
      function onEmitterUpdate(search: URLSearchParams) {
        startTransition(() => {
          setSearchParams(applyChange(search, watchKeys, true))
        })
      }
      emitter.on('update', onEmitterUpdate)
      window.addEventListener('popstate', onPopState)
      // Catch up with the URL as it stands now that we're subscribed. A hook
      // mounting during a navigation transition subscribes after the emitter
      // has fired (e.g. a sibling route's shallow update), so its state would
      // otherwise stay stale — and an outgoing route could then re-run a
      // render-phase update and leak its value onto the route we navigated to
      // (#1358). Only commit when it actually moved, to avoid a no-op re-render.
      const caughtUp = applyChange(
        new URLSearchParams(location.search),
        watchKeys,
        false
      )(searchParams)
      // Compare by value: with no watched keys `applyChange` always returns a
      // fresh instance, so a reference check would re-render on every mount.
      if (caughtUp.toString() !== searchParams.toString()) {
        setSearchParams(caughtUp)
      }
      return () => {
        emitter.off('update', onEmitterUpdate)
        window.removeEventListener('popstate', onPopState)
      }
    }, [watchKeys.join('&')])
    return searchParams
  }
  /**
   * Sync shallow updates of the URL with the useOptimisticSearchParams hook.
   *
   * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
   * If third party code updates the History API directly, use this function to
   * enable useOptimisticSearchParams to react to those changes.
   *
   * Note: this is actually required in React Router frameworks to follow Link navigations.
   */
  applyHistoryPatch(emitter, adapter, { trackRouterHistory: true })

  return {
    NuqsAdapter: createAdapterProvider(useNuqsReactRouterBasedAdapter),
    useOptimisticSearchParams
  }
}
