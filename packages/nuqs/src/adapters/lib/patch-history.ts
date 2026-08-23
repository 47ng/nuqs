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

type PendingPush = {
  href: string
  poppedSince: boolean
}

const pendingPush = globalSingleton('pending-push', () => ({
  current: null as PendingPush | null
}))

export function markPendingPush(url: URL): void {
  pendingPush.current = { href: url.href, poppedSince: false }
}

export function hasPendingPush(): boolean {
  return pendingPush.current !== null
}

function clearPendingPush(): void {
  pendingPush.current = null
}

function notePopSincePendingPush(): void {
  if (pendingPush.current) {
    pendingPush.current.poppedSince = true
  }
}

function commitTakesOverPendingPush(url: string | URL): boolean {
  const pending = pendingPush.current
  if (!pending) {
    return false
  }
  const href = new URL(url, location.href).href
  return href === pending.href || !pending.poppedSince
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
    notePopSincePendingPush()
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
    // The router committing an optimistic deep push must not add
    // a second entry (#1563).
    const commit = commitTakesOverPendingPush(url)
      ? originalReplaceState
      : originalPushState
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
