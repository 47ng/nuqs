import type { Emitter } from 'mitt'
import { debug } from '../../lib/debug'
import { error } from '../../lib/errors'

export type SearchParamsSyncEmitter = Emitter<{ update: URLSearchParams }>

export const historyUpdateMarker = '__nuqs__'

declare global {
  interface History {
    nuqs?: {
      version: string
      adapters: string[]
    }
  }
}

export function getSearchParams(url: string | URL): URLSearchParams {
  if (url instanceof URL) {
    return url.searchParams
  }
  if (url.startsWith('?')) {
    return new URLSearchParams(url)
  }
  try {
    return new URL(url, location.origin).searchParams
  } catch {
    return new URLSearchParams(url)
  }
}

export function patchHistory(
  emitter: SearchParamsSyncEmitter,
  adapter: string
): void {
  if (typeof history === 'undefined') {
    return
  }
  if (
    history.nuqs?.version &&
    history.nuqs.version !== '0.0.0-inject-version-here'
  ) {
    console.error(
      error(409),
      history.nuqs.version,
      `0.0.0-inject-version-here`,
      adapter
    )
    return
  }
  if (history.nuqs?.adapters?.includes(adapter)) {
    return
  }
  let lastSearchSeen = typeof location === 'object' ? location.search : ''

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  debug(
    '[nuqs %s] Patching history (%s adapter)',
    '0.0.0-inject-version-here',
    adapter
  )
  function sync(url: URL | string) {
    try {
      const newSearch = new URL(url, location.origin).search
      if (newSearch === lastSearchSeen) {
        return
      }
    } catch {}
    try {
      emitter.emit('update', getSearchParams(url))
    } catch (e) {
      console.error(e)
    }
  }
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  history.pushState = function nuqs_pushState(state, marker, url) {
    originalPushState.call(history, state, '', url)
    if (url && marker !== historyUpdateMarker) {
      sync(url)
    }
  }
  history.replaceState = function nuqs_replaceState(state, marker, url) {
    originalReplaceState.call(history, state, '', url)
    if (url && marker !== historyUpdateMarker) {
      sync(url)
    }
  }
  // Mark as patched
  history.nuqs = history.nuqs ?? {
    // This will be replaced by the prepack script
    version: '0.0.0-inject-version-here',
    adapters: []
  }
  history.nuqs.adapters.push(adapter)
}
