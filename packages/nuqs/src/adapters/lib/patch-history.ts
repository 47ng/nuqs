import { debug } from '../../lib/debug'
import { createEmitter, type Emitter } from '../../lib/emitter'
import { error } from '../../lib/errors'
import { globalSingleton } from '../../lib/global-singleton'
import { resetQueues, spinQueueResetMutex } from '../../lib/queues/reset'
import { getSearchParams } from '../../lib/search-params'
import { version } from '../../lib/version'

export type SearchParamsSyncEmitterEvents = { update: URLSearchParams }

export function getHistorySyncEmitter(
  adapter: string
): Emitter<SearchParamsSyncEmitterEvents> {
  return globalSingleton(`history-emitter.${adapter}`, () =>
    createEmitter<SearchParamsSyncEmitterEvents>()
  )
}

export const historyUpdateMarker = '__nuqs__'

const pendingPush = globalSingleton('pending-push', () => ({
  active: false
}))

export function markPendingPush(): void {
  pendingPush.active = true
}

export function hasPendingPush(): boolean {
  return pendingPush.active
}

function clearPendingPush(): void {
  pendingPush.active = false
}

declare global {
  interface History {
    nuqs?: {
      version: string
      adapters: string[]
    }
  }
}

export function shouldPatchHistory(adapter: string): boolean {
  if (typeof history === 'undefined') {
    return false
  }
  if (history.nuqs?.version && history.nuqs.version !== version) {
    console.error(error(409), history.nuqs.version, version, adapter)
    return false
  }
  if (history.nuqs?.adapters?.includes(adapter)) {
    return false
  }
  return true
}

export function markHistoryAsPatched(adapter: string): void {
  history.nuqs = history.nuqs ?? {
    version,
    adapters: []
  }
  history.nuqs.adapters.push(adapter)
}

export function patchHistory(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string
): void {
  if (!shouldPatchHistory(adapter)) {
    return
  }
  let lastSearchSeen = typeof location === 'object' ? location.search : ''

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  window.addEventListener('popstate', () => {
    lastSearchSeen = location.search
    clearPendingPush()
    resetQueues()
  })

  debug(21, version, adapter)
  function sync(url: URL | string) {
    spinQueueResetMutex()
    try {
      const newSearch = new URL(url, location.href).search
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
    if (marker === historyUpdateMarker || !url) {
      originalPushState.call(history, state, '', url)
      return
    }
    // A router committing a navigation nuqs already pushed optimistically
    // must not push a second entry (#1563).
    const commit = hasPendingPush() ? originalReplaceState : originalPushState
    clearPendingPush()
    commit.call(history, state, '', url)
    sync(url)
  }
  history.replaceState = function nuqs_replaceState(state, marker, url) {
    originalReplaceState.call(history, state, '', url)
    if (url && marker !== historyUpdateMarker) {
      clearPendingPush()
      sync(url)
    }
  }
  markHistoryAsPatched(adapter)
}
