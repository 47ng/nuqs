import mitt from 'mitt'
import { useEffect, useState } from 'react'
import { debug } from '../debug'
import { renderQueryString } from '../url-encoding'
import { createAdapterProvider } from './lib/context'
import type { AdapterOptions } from './lib/defs'
import {
  historyUpdateMarker,
  patchHistory,
  type SearchParamsSyncEmitter
} from './lib/patch-history'

const emitter: SearchParamsSyncEmitter = mitt()

function updateUrl(search: URLSearchParams, options: AdapterOptions) {
  const url = new URL(location.href)
  url.search = renderQueryString(search)
  const method =
    options.history === 'push' ? history.pushState : history.replaceState
  method.call(history, history.state, historyUpdateMarker, url)
  emitter.emit('update', search)
}

function useNuqsReactAdapter(watchKeys: string[]) {
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof location === 'undefined') {
      return new URLSearchParams()
    }
    const search = new URLSearchParams(location.search)
    filterSearchParams(search, watchKeys)
    return search
  })
  useEffect(() => {
    // Popstate event is only fired when the user navigates
    // via the browser's back/forward buttons.
    const onPopState = () => {
      setSearchParams(
        applyChange(new URLSearchParams(location.search), watchKeys)
      )
    }
    const onEmitterUpdate = (search: URLSearchParams) => {
      setSearchParams(applyChange(search, watchKeys))
    }
    emitter.on('update', onEmitterUpdate)
    window.addEventListener('popstate', onPopState)
    return () => {
      emitter.off('update', onEmitterUpdate)
      window.removeEventListener('popstate', onPopState)
    }
  }, [watchKeys.join('&')])

  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactAdapter)

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

function applyChange(newValue: URLSearchParams, keys: string[]) {
  return (oldValue: URLSearchParams) => {
    const hasChanged =
      keys.length === 0
        ? true
        : keys.some(key => oldValue.get(key) !== newValue.get(key))
    if (!hasChanged) {
      debug(
        '[nuqs `%s`] no change, returning previous',
        keys.join(','),
        oldValue
      )
      return oldValue
    }
    const copy = new URLSearchParams(newValue)
    filterSearchParams(copy, keys)
    debug(
      `[nuqs \`%s\`] subbed search params change
  from %O
  to   %O`,
      keys.join(','),
      oldValue,
      copy
    )
    return copy
  }
}

function filterSearchParams(search: URLSearchParams, keys: string[]) {
  if (keys.length === 0) {
    return
  }
  for (const key of search.keys()) {
    if (!keys.includes(key)) {
      search.delete(key)
    }
  }
}
