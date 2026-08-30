import {
  startTransition,
  useCallback,
  useEffect,
  useInsertionEffect,
  useState
} from 'react'
import { debug } from '../../lib/debug'
import { setQueueResetMutex } from '../../lib/queues/reset'
import { renderQueryString } from '../../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import { applyChange, filterSearchParams } from './key-isolation'
import {
  getHistorySyncEmitter,
  historyUpdateMarker,
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

type CreateReactRouterBasedAdapterArgs = {
  adapter: string
  useNavigate: UseNavigate
  useSearchParams: UseSearchParams
}

export function createReactRouterBasedAdapter({
  adapter,
  useNavigate,
  useSearchParams
}: CreateReactRouterBasedAdapterArgs): {
  NuqsAdapter: AdapterProvider
  useOptimisticSearchParams: () => URLSearchParams
} {
  const emitter = getHistorySyncEmitter(adapter)
  function useNuqsReactRouterBasedAdapter(
    watchKeys: string[]
  ): AdapterInterface {
    const navigate = useNavigate()
    const searchParams = useOptimisticSearchParams(watchKeys)
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        const url = new URL(location.href)
        url.search = renderQueryString(search)
        debug(20, adapter, url)
        // First, update the URL locally without triggering a network request,
        // this allows keeping a reactive URL if the network is slow.
        const updateMethod =
          options.history === 'push' ? history.pushState : history.replaceState
        setQueueResetMutex(options.shallow ? 1 : 2)
        updateMethod.call(
          history,
          history.state, // Maintain the history state
          historyUpdateMarker,
          url
        )
        let navigationSettled: Promise<void> | undefined
        if (options.shallow === false) {
          const maybePromise = navigate(
            {
              // Somehow passing the full URL object here strips the search params
              // when accessing the request.url in loaders.
              hash: url.hash,
              search: url.search
            },
            {
              replace: true,
              preventScrollReset: true,
              state: history.state?.usr
            }
          )
          // Returning the navigation promise (v7+) turns the user's
          // startTransition into an async action, keeping isPending true
          // until loaders have settled (#1184). It must come from the router,
          // not from observing a commit: while the action is pending, React
          // entangles the router's own transition-wrapped state updates with
          // it, so waiting on a commit would deadlock.
          if (maybePromise instanceof Promise) {
            navigationSettled = maybePromise
          }
        }
        if (options.scroll) {
          window.scrollTo(0, 0)
        }
        return navigationSettled
      },
      [navigate]
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
    // Activity disconnects passive effects while hidden. Keep the router
    // subscription attached so a memoized reader has pending work before reveal.
    useInsertionEffect(() => {
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
      return () => {
        emitter.off('update', onEmitterUpdate)
        window.removeEventListener('popstate', onPopState)
      }
    }, [JSON.stringify(watchKeys)])
    useEffect(() => {
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
    }, [JSON.stringify(watchKeys)])
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
  applyHistoryPatch(emitter, adapter)

  return {
    NuqsAdapter: createAdapterProvider(useNuqsReactRouterBasedAdapter),
    useOptimisticSearchParams
  }
}
