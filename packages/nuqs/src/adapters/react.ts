import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode
} from 'react'
import { debug } from '../lib/debug'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProps } from './lib/context'
import type { AdapterInterface, AdapterOptions } from './lib/defs'
import { filterSearchParams } from './lib/key-isolation'
import {
  getHistorySyncEmitter,
  historyUpdateMarker,
  patchHistory
} from './lib/patch-history'

const emitter = getHistorySyncEmitter('react')

function generateUpdateUrlFn(fullPageNavigationOnShallowFalseUpdates: boolean) {
  return function updateUrl(search: URLSearchParams, options: AdapterOptions) {
    const url = new URL(location.href)
    url.search = renderQueryString(search)
    debug(20, 'react', url)
    if (fullPageNavigationOnShallowFalseUpdates && options.shallow === false) {
      const method =
        options.history === 'push' ? location.assign : location.replace
      method.call(location, url)
    } else {
      const method =
        options.history === 'push' ? history.pushState : history.replaceState
      method.call(history, history.state, historyUpdateMarker, url)
    }
    emitter.emit('update', search)
    if (options.scroll === true) {
      window.scrollTo({ top: 0 })
    }
  }
}

const NuqsReactAdapterContext = createContext<{
  fullPageNavigationOnShallowFalseUpdates: boolean
  serverSearch?: string | URLSearchParams
}>({
  fullPageNavigationOnShallowFalseUpdates: false
})

const emptySearchParams = new URLSearchParams()

function subscribe(onStoreChange: () => void) {
  emitter.on('update', onStoreChange)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    emitter.off('update', onStoreChange)
    window.removeEventListener('popstate', onStoreChange)
  }
}

function useNuqsReactAdapter(watchKeys: string[]): AdapterInterface {
  const { fullPageNavigationOnShallowFalseUpdates, serverSearch } = useContext(
    NuqsReactAdapterContext
  )
  // There is no location to read from when server-side rendering: snapshot the
  // server-provided search string instead (eg: in Astro SSR, Inertia, Fastify,
  // Hono etc). React also renders from this snapshot when hydrating, so server
  // and client markup agree by construction for deep links.
  // Cached for referential stability (useSyncExternalStore Object.is bail-out).
  const serverSnapshotCache = useRef<URLSearchParams | null>(null)
  const getServerSnapshot = () => {
    if (serverSnapshotCache.current === null) {
      serverSnapshotCache.current =
        serverSearch === undefined
          ? emptySearchParams
          : filterSearchParams(
              new URLSearchParams(serverSearch),
              watchKeys,
              false
            )
    }
    return serverSnapshotCache.current
  }
  // Reading location.search live in getSnapshot (rather than from React state
  // synced by an effect) keeps the value fresh even on the first render after an
  // <Activity> subtree is revealed: its effects — and thus the emitter
  // subscription — were detached while hidden and missed the URL update (#1444).
  const cache = useRef<{ key: string; search: URLSearchParams } | null>(null)
  const searchParams = useSyncExternalStore(
    subscribe,
    () => {
      const filteredSearch = filterSearchParams(
        new URLSearchParams(location.search),
        watchKeys,
        false
      )
      // Return a referentially-stable snapshot while the watched keys are unchanged:
      // required by useSyncExternalStore (Object.is bail-out),
      // and it preserves key isolation (a change to an unwatched key keeps the same ref,
      // so this hook doesn't re-render).
      const key = filteredSearch.toString()
      if (cache.current?.key === key) {
        return cache.current.search
      }
      cache.current = { key, search: filteredSearch }
      return filteredSearch
    },
    getServerSnapshot
  )
  const updateUrl = useMemo(
    () => generateUpdateUrlFn(fullPageNavigationOnShallowFalseUpdates),
    [fullPageNavigationOnShallowFalseUpdates]
  )
  return {
    searchParams,
    updateUrl
  }
}

const NuqsReactAdapter = createAdapterProvider(useNuqsReactAdapter)

export function NuqsAdapter({
  children,
  fullPageNavigationOnShallowFalseUpdates = false,
  serverSearch,
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
  fullPageNavigationOnShallowFalseUpdates?: boolean
  /**
   * Search params to seed the initial state with when server-side rendering,
   * where `location` is not available (eg: `Astro.url.search` in Astro SSR,
   * or the request URL's search string in Inertia, Fastify, Hono etc).
   *
   * Without it, the server renders parsers' default values, which causes
   * hydration errors and a flash of default content on deep links.
   * Accepts the search string with or without the leading `?`.
   */
  serverSearch?: string | URLSearchParams
}): ReactElement {
  return createElement(
    NuqsReactAdapterContext.Provider,
    { value: { fullPageNavigationOnShallowFalseUpdates, serverSearch } },
    createElement(NuqsReactAdapter, { ...adapterProps, children })
  )
}

/**
 * Opt-in to syncing shallow updates of the URL with the useOptimisticSearchParams hook.
 *
 * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
 * If third party code updates the History API directly, use this function to
 * enable useOptimisticSearchParams to react to those changes.
 */
export function enableHistorySync(): void {
  patchHistory(emitter, 'react')
}
