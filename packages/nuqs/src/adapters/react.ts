import mitt from 'mitt'
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { renderQueryString } from '../url-encoding'
import { createAdapterProvider } from './lib/context'
import type { AdapterOptions } from './lib/defs'
import { patchHistory, type SearchParamsSyncEmitter } from './lib/patch-history'

const emitter: SearchParamsSyncEmitter = mitt()

function generateUpdateUrlFn(fullPageNavigationOnShallowFalseUpdates: boolean) {
  return function updateUrl(search: URLSearchParams, options: AdapterOptions) {
    const url = new URL(location.href)
    url.search = renderQueryString(search)
    if (fullPageNavigationOnShallowFalseUpdates && options.shallow === false) {
      const method =
        options.history === 'push' ? location.assign : location.replace
      method.call(location, url)
    } else {
      const method =
        options.history === 'push' ? history.pushState : history.replaceState
      method.call(history, history.state, '', url)
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

function useNuqsReactAdapter() {
  const { fullPageNavigationOnShallowFalseUpdates } = useContext(
    NuqsReactAdapterContext
  )
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof location === 'undefined') {
      return new URLSearchParams()
    }
    return new URLSearchParams(location.search)
  })
  useEffect(() => {
    // Popstate event is only fired when the user navigates
    // via the browser's back/forward buttons.
    const onPopState = () => {
      setSearchParams(new URLSearchParams(location.search))
    }
    emitter.on('update', setSearchParams)
    window.addEventListener('popstate', onPopState)
    return () => {
      emitter.off('update', setSearchParams)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])
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
  fullPageNavigationOnShallowFalseUpdates = false
}: {
  children: ReactNode
  fullPageNavigationOnShallowFalseUpdates?: boolean
}) {
  return createElement(
    NuqsReactAdapterContext.Provider,
    { value: { fullPageNavigationOnShallowFalseUpdates } },
    createElement(NuqsReactAdapter, null, children)
  )
}

/**
 * Opt-in to syncing shallow updates of the URL with the useOptimisticSearchParams hook.
 *
 * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
 * If third party code updates the History API directly, use this function to
 * enable useOptimisticSearchParams to react to those changes.
 */
export function enableHistorySync() {
  patchHistory(emitter, 'react')
}
