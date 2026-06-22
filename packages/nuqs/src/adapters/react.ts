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
import { createEmitter } from '../lib/emitter'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProps } from './lib/context'
import type { AdapterInterface, AdapterOptions } from './lib/defs'
import { filterSearchParams } from './lib/key-isolation'
import {
  historyUpdateMarker,
  patchHistory,
  type SearchParamsSyncEmitterEvents
} from './lib/patch-history'

const emitter = createEmitter<SearchParamsSyncEmitterEvents>()

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

const NuqsReactAdapterContext = createContext({
  fullPageNavigationOnShallowFalseUpdates: false
})

const emptySearchParams = new URLSearchParams()

// Note: we could expose a getServerSnapshot() function to allow server-side rendering
// to let consumers wire that to their backend router (eg: in Astro SSR, Fastify, Hono etc).
function getServerSnapshot() {
  return emptySearchParams
}

function subscribe(onStoreChange: () => void) {
  emitter.on('update', onStoreChange)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    emitter.off('update', onStoreChange)
    window.removeEventListener('popstate', onStoreChange)
  }
}

function useNuqsReactAdapter(watchKeys: string[]): AdapterInterface {
  const { fullPageNavigationOnShallowFalseUpdates } = useContext(
    NuqsReactAdapterContext
  )
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
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
  fullPageNavigationOnShallowFalseUpdates?: boolean
}): ReactElement {
  return createElement(
    NuqsReactAdapterContext.Provider,
    { value: { fullPageNavigationOnShallowFalseUpdates } },
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
