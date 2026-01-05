import { startTransition, useCallback, useEffect, useState } from 'react'
import { debug } from '../../lib/debug'
import { createEmitter } from '../../lib/emitter'
import { setQueueResetMutex } from '../../lib/queues/reset'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import { applyChange, filterSearchParams } from './key-isolation'
import {
  historyUpdateMarker,
  patchHistoryWithStrategy,
  type SearchParamsSyncEmitterEvents
} from './patch-history'
import {
  createStrategy,
  type RouterMode,
  type RouterModeStrategy
} from './router-strategies'

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
type NavigateFn = (url: NavigateUrl, options: NavigateOptions) => void
type UseNavigate = () => NavigateFn
type UseSearchParams = (initial: URLSearchParams) => [URLSearchParams, {}]

// --

type CreateReactRouterBasedAdapterArgs = {
  adapter: string
  useSearchParams: UseSearchParams
  /**
   * Router mode: 'standard' uses location.search, 'hash' uses location.hash
   * @default 'standard'
   */
  mode?: RouterMode
  /**
   * Required for standard mode to trigger server-side navigation on shallow:false updates.
   * Not needed for hash mode since hash is never sent to server.
   */
  useNavigate?: UseNavigate
}

export function createReactRouterBasedAdapter({
  adapter,
  useSearchParams,
  mode = 'standard',
  useNavigate
}: CreateReactRouterBasedAdapterArgs): {
  NuqsAdapter: AdapterProvider
  useOptimisticSearchParams: () => URLSearchParams
} {
  const strategy: RouterModeStrategy = createStrategy(mode)
  const emitter = createEmitter<SearchParamsSyncEmitterEvents>()
  function useNuqsReactRouterBasedAdapter(
    watchKeys: string[]
  ): AdapterInterface {
    // Only call useNavigate hook if provided (not needed for hash mode)
    const navigate = useNavigate?.()
    const searchParams = useOptimisticSearchParams(watchKeys)
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        // Use strategy to construct URL appropriate for the router mode
        const url = strategy.constructUrl(search)
        debug(`[nuqs ${adapter}] Updating url: %s`, url)
        // First, update the URL locally without triggering a network request,
        // this allows keeping a reactive URL if the network is slow.
        const updateMethod =
          options.history === 'push' ? history.pushState : history.replaceState
        setQueueResetMutex(strategy.getQueueResetMutex(options.shallow ?? true))
        updateMethod.call(
          history,
          history.state, // Maintain the history state
          historyUpdateMarker,
          url
        )
        // Only call navigate for non-shallow updates if the strategy supports server navigation
        // (hash mode doesn't since hash is never sent to server)
        if (
          options.shallow === false &&
          strategy.supportsServerNavigation &&
          navigate
        ) {
          navigate(
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
        }
        if (options.scroll) {
          window.scrollTo(0, 0)
        }
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
        : strategy.getSearchParams()
    )
    const [searchParams, setSearchParams] = useState(() => {
      return typeof location === 'undefined'
        ? // We use this on the server to SSR with the correct search params.
          // Note: In HashRouter, server-side hash is typically empty.
          filterSearchParams(serverSearchParams, watchKeys, true)
        : // Since useSearchParams isn't reactive to shallow changes,
          // it doesn't pick up changes in the URL on mount, so we need to initialise
          // the reactive state with the current URL instead.
          filterSearchParams(
            strategy.getSearchParams(),
            watchKeys,
            false // No need for a copy here
          )
    })
    useEffect(() => {
      function onNavigationChange() {
        setSearchParams(
          applyChange(strategy.getSearchParams(), watchKeys, false)
        )
      }
      function onEmitterUpdate(search: URLSearchParams) {
        setSearchParams(applyChange(search, watchKeys, true))
      }
      emitter.on('update', onEmitterUpdate)
      // Subscribe to all navigation events for this mode
      for (const event of strategy.navigationEvents) {
        window.addEventListener(event, onNavigationChange)
      }
      return () => {
        emitter.off('update', onEmitterUpdate)
        for (const event of strategy.navigationEvents) {
          window.removeEventListener(event, onNavigationChange)
        }
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
  patchHistoryWithStrategy(emitter, adapter, strategy)

  return {
    NuqsAdapter: createAdapterProvider(useNuqsReactRouterBasedAdapter),
    useOptimisticSearchParams
  }
}
