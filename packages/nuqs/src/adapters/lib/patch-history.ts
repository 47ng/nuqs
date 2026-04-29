import { debug } from '../../lib/debug'
import type { Emitter } from '../../lib/emitter'
import { error } from '../../lib/errors'
import { resetQueues, spinQueueResetMutex } from '../../lib/queues/reset'
import { getSearchParams } from '../../lib/search-params'

export type SearchParamsSyncEmitterEvents = { update: URLSearchParams }

export const historyUpdateMarker = '__nuqs__'

declare global {
  interface History {
    nuqs?: {
      version: string
      adapters: string[]
    }
  }
}

export function shouldPatchHistory(adapter: string): boolean {
  if (typeof history === 'undefined') return false
  const v = history.nuqs?.version
  if (v && v !== '0.0.0-inject-version-here') {
    console.error(error(409), v, `0.0.0-inject-version-here`, adapter)
    return false
  }
  return !history.nuqs?.adapters?.includes(adapter)
}

export function markHistoryAsPatched(adapter: string): void {
  // version replaced by the prepack script
  ;(history.nuqs ??= {
    version: '0.0.0-inject-version-here',
    adapters: []
  }).adapters.push(adapter)
}

export function patchHistory(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string
): void {
  if (!shouldPatchHistory(adapter)) return
  let lastSearchSeen = typeof location === 'object' ? location.search : ''

  emitter.on('update', search => {
    const s = search.toString()
    lastSearchSeen = s ? '?' + s : ''
  })

  window.addEventListener('popstate', () => {
    lastSearchSeen = location.search
    resetQueues()
  })

  debug(
    '[nuqs %s] Patching history (%s adapter)',
    '0.0.0-inject-version-here',
    adapter
  )
  function sync(url: URL | string) {
    spinQueueResetMutex()
    try {
      if (new URL(url, location.origin).search === lastSearchSeen) return
    } catch {}
    try {
      emitter.emit('update', getSearchParams(url))
    } catch (e) {
      console.error(e)
    }
  }
  for (const m of ['pushState', 'replaceState'] as const) {
    const orig = history[m]
    history[m] = function (state, marker, url) {
      orig.call(history, state, '', url)
      if (url && marker !== historyUpdateMarker) sync(url)
    }
  }
  markHistoryAsPatched(adapter)
}
