import mitt from 'mitt'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { renderQueryString } from '../../url-encoding'
import type { AdapterInterface, AdapterOptions } from './defs'
import {
  historyUpdateMarker,
  patchHistory,
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
}
type NavigateFn = (url: NavigateUrl, options: NavigateOptions) => void
type UseNavigate = () => NavigateFn

type UseSearchParams = () => [URLSearchParams, {}]

// --

export function createReactRouterBasedAdapter(
  adapter: string,
  useNavigate: UseNavigate,
  useSearchParams: UseSearchParams
) {
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
              preventScrollReset: true
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
  function useOptimisticSearchParams() {
    const [serverSearchParams] = useSearchParams()
    const [searchParams, setSearchParams] = useState(serverSearchParams)
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
    useEffect(() => {
      console.log('sync from serverSearchParams:', serverSearchParams.toString())
      emitter.emit('update', serverSearchParams)
    }, [serverSearchParams])
    return searchParams
  }
  /**
   * Opt-in to syncing shallow updates of the URL with the useOptimisticSearchParams hook.
   *
   * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
   * If third party code updates the History API directly, use this function to
   * enable useOptimisticSearchParams to react to those changes.
   */
  function enableHistorySync() {
    patchHistory(emitter, adapter)
  }

  return {
    useNuqsReactRouterBasedAdapter,
    useOptimisticSearchParams,
    enableHistorySync
  }
}
