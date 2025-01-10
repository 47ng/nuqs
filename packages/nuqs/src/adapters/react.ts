import mitt from 'mitt'
import { useEffect, useState } from 'react'
import { renderQueryString } from '../url-encoding'
import { createAdapterProvider } from './lib/context'
import type { AdapterOptions } from './lib/defs'
import { applyChange, filterSearchParams } from './lib/key-isolation'
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
    return filterSearchParams(
      new URLSearchParams(location.search),
      watchKeys,
      false
    )
  })
  useEffect(() => {
    // Popstate event is only fired when the user navigates
    // via the browser's back/forward buttons.
    const onPopState = () => {
      setSearchParams(
        applyChange(new URLSearchParams(location.search), watchKeys, false)
      )
    }
    const onEmitterUpdate = (search: URLSearchParams) => {
      setSearchParams(applyChange(search, watchKeys, true))
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
