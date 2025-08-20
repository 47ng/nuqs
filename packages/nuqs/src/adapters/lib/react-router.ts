import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { debug } from '../../lib/debug'
import { createEmitter } from '../../lib/emitter'
import { setQueueResetMutex } from '../../lib/queues/reset'
import { globalThrottleQueue } from '../../lib/queues/throttle'
import { renderQueryString } from '../../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import { applyChange, filterSearchParams } from './key-isolation'
import {
  patchHistory as applyHistoryPatch,
  historyUpdateMarker,
  type SearchParamsSyncEmitterEvents
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
  const emitter = createEmitter<SearchParamsSyncEmitterEvents>()
  const enableQueueReset = adapter !== 'react-router-v6'
  function useNuqsReactRouterBasedAdapter(
    watchKeys: string[]
  ): AdapterInterface {
    const resetRef = useRef(false)
    if (enableQueueReset && resetRef.current) {
      resetRef.current = false
      globalThrottleQueue.reset()
    }

    const navigate = useNavigate()
    const searchParams = useOptimisticSearchParams(watchKeys)
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        const url = new URL(location.href)
        url.search = renderQueryString(search)
        debug(`[nuqs ${adapter}] Updating url: %s`, url)
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
        resetRef.current = enableQueueReset
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
    useEffect(() => {
      function onPopState() {
        setSearchParams(
          applyChange(new URLSearchParams(location.search), watchKeys, false)
        )
      }
      function onEmitterUpdate(search: URLSearchParams) {
        setSearchParams(applyChange(search, watchKeys, true))
      }
      emitter.on('update', onEmitterUpdate)
      window.addEventListener('popstate', onPopState)
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
  applyHistoryPatch(emitter, adapter)

  return {
    NuqsAdapter: createAdapterProvider(useNuqsReactRouterBasedAdapter),
    useOptimisticSearchParams
  }
}
