import {
  useNavigate,
  useSearchParams as useRemixSearchParams
} from '@remix-run/react'
import mitt from 'mitt'
import { startTransition, useEffect, useLayoutEffect, useState } from 'react'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'
import {
  historyUpdateMarker,
  patchHistory,
  type SearchParamsSyncEmitter
} from './patch-history'

const emitter: SearchParamsSyncEmitter = mitt()

function useNuqsRemixAdapter() {
  const navigate = useNavigate()
  const searchParams = useOptimisticSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
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
    if (options.scroll) {
      window.scrollTo(0, 0)
    }
    if (!options.shallow) {
      navigate(url, {
        replace: true,
        preventScrollReset: true
      })
    }
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsRemixAdapter)

export function useOptimisticSearchParams() {
  const [serverSearchParams] = useRemixSearchParams()
  const [searchParams, setSearchParams] = useState(serverSearchParams)
  useEffect(() => {
    emitter.on('update', setSearchParams)
    return () => {
      emitter.off('update', setSearchParams)
    }
  }, [])
  useLayoutEffect(() => {
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
export function enableHistorySync() {
  patchHistory(emitter, 'remix')
}
