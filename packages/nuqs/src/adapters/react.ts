import mitt from 'mitt'
import { useEffect, useState } from 'react'
import { debug } from '../lib/debug'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider } from './lib/context'
import type { AdapterInterface, AdapterOptions } from './lib/defs'
import { patchHistory, type SearchParamsSyncEmitter } from './lib/patch-history'

const emitter: SearchParamsSyncEmitter = mitt()

function updateUrl(search: URLSearchParams, options: AdapterOptions) {
  const url = new URL(location.href)
  url.search = renderQueryString(search)
  debug('[nuqs react] Updating url: %s', url)
  const method =
    options.history === 'push' ? history.pushState : history.replaceState
  method.call(history, history.state, '', url)
  emitter.emit('update', search)
}

function useNuqsReactAdapter(): AdapterInterface {
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
