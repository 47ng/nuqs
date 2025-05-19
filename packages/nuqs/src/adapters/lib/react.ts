import mitt from 'mitt'
import {
  useEffect,
  useState,
} from 'react'
import { renderQueryString } from '../../url-encoding'
import type { AdapterOptions } from './defs'
import { patchHistory, type SearchParamsSyncEmitter } from './patch-history'

const emitter: SearchParamsSyncEmitter = mitt()

export function generateUpdateUrlFn(fullPageNavigationOnShallowFalseUpdates: boolean) {
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

export function useReactSearchParams() {
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

  return searchParams
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
