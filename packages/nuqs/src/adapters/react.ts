import mitt from 'mitt'
import { useSyncExternalStore } from 'react'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

const emitter = mitt<{ update: void }>()

function subscribe(callback: () => void) {
  emitter.on('update', callback)
  window.addEventListener('popstate', callback)
  return () => {
    emitter.off('update', callback)
    window.removeEventListener('popstate', callback)
  }
}

function getSnapshot() {
  return new URLSearchParams(location.search)
}

function getServerSnapshot() {
  return new URLSearchParams()
}

function updateUrl(search: URLSearchParams, options: AdapterOptions) {
  const url = new URL(location.href)
  url.search = renderQueryString(search)
  const method =
    options.history === 'push' ? history.pushState : history.replaceState
  method.call(history, history.state, '', url)
  emitter.emit('update')
}

function useNuqsReactAdapter() {
  const searchParams = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactAdapter)
