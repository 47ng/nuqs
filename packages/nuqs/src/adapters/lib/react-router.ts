import mitt from 'mitt'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { renderQueryString } from '../../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import {
  patchHistory as applyHistoryPatch,
  historyUpdateMarker,
  type SearchParamsSyncEmitter
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
type NavigateFn = (url: NavigateUrl, options: NavigateOptions) => void
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
  const emitter: SearchParamsSyncEmitter = mitt()
  function useNuqsReactRouterBasedAdapter(): AdapterInterface {
    const navigate = useNavigate()
    const searchParams = useOptimisticSearchParams()
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        const url = new URL(location.href)
        url.search = renderQueryString(search)
        // First, update the URL locally without triggering a network request,
        // this allows keeping a reactive URL if the network is slow.
        const updateMethod =
          options.history === 'push' ? history.pushState : history.replaceState
        updateMethod.call(
          history,
          history.state, // Maintain the history state
          historyUpdateMarker,
          url
        )
        if (options.shallow === false) {
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
      updateUrl
    }
  }
  function useOptimisticSearchParams(): URLSearchParams {
    const [serverSearchParams] = useSearchParams(
      // Note: this will only be taken into account the first time the hook is called,
      // and cached for subsequent calls, causing problems when mounting components
      // after shallow updates have occurred.
      typeof location === 'undefined'
        ? new URLSearchParams()
        : new URLSearchParams(location.search)
    )
    const [searchParams, setSearchParams] = useState(() => {
      if (typeof location === 'undefined') {
        // We use this on the server to SSR with the correct search params.
        return serverSearchParams
      }
      // Since useSearchParams isn't reactive to shallow changes,
      // it doesn't pick up changes in the URL on mount, so we need to initialise
      // the reactive state with the current URL instead.
      return new URLSearchParams(location.search)
    })
    useEffect(() => {
      function onPopState() {
        setSearchParams(new URLSearchParams(location.search))
      }
      function onEmitterUpdate(search: URLSearchParams) {
        setSearchParams(search)
      }
      emitter.on('update', onEmitterUpdate)
      window.addEventListener('popstate', onPopState)
      return () => {
        emitter.off('update', onEmitterUpdate)
        window.removeEventListener('popstate', onPopState)
      }
    }, [])
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
