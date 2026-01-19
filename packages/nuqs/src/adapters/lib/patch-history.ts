import { debug } from '../../lib/debug'
import type { Emitter } from '../../lib/emitter'
import { error } from '../../lib/errors'
import { resetQueues, spinQueueResetMutex } from '../../lib/queues/reset'
import {
  createStandardStrategy,
  type RouterModeStrategy
} from './router-strategies'

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

/**
 * Legacy function for backwards compatibility with other adapters.
 * For React Router adapters, use the strategy-based approach instead.
 */
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

export function shouldPatchHistory(adapter: string): boolean {
  if (typeof history === 'undefined') {
    return false
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
    return false
  }
  if (history.nuqs?.adapters?.includes(adapter)) {
    return false
  }
  return true
}

export function markHistoryAsPatched(adapter: string): void {
  history.nuqs = history.nuqs ?? {
    // This will be replaced by the prepack script
    version: '0.0.0-inject-version-here',
    adapters: []
  }
  history.nuqs.adapters.push(adapter)
}

/**
 * Unified history patching that works with any router mode strategy.
 * The strategy determines how to extract search params from URLs.
 */
export function patchHistoryWithStrategy(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string,
  strategy: RouterModeStrategy
): void {
  if (!shouldPatchHistory(adapter)) {
    return
  }

  // Track the last search string we've seen
  let lastSearchSeen =
    typeof location === 'object' ? strategy.getSearchString() : ''

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  // Subscribe to all navigation events for this mode
  for (const event of strategy.navigationEvents) {
    window.addEventListener(event, () => {
      lastSearchSeen = strategy.getSearchString()
      resetQueues()
    })
  }

  const modeLabel = strategy.supportsServerNavigation ? '' : ' hash'
  debug(
    '[nuqs %s] Patching history%s (%s adapter)',
    '0.0.0-inject-version-here',
    modeLabel,
    adapter
  )

  function sync(url: URL | string) {
    spinQueueResetMutex()

    const newSearch = strategy.extractSearchStringFromUrl(url)
    if (newSearch === null) {
      // Could not extract search, skip
      return
    }

    try {
      if (newSearch === lastSearchSeen) {
        return
      }
      const searchParams = strategy.extractSearchParamsFromUrl(url)
      if (searchParams) {
        emitter.emit('update', searchParams)
      }
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

  markHistoryAsPatched(adapter)
}

/**
 * Legacy patchHistory function for backwards compatibility.
 * Uses standard strategy (location.search) behavior.
 */
export function patchHistory(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string
): void {
  // Delegate to strategy-based implementation with standard (location.search) strategy
  patchHistoryWithStrategy(emitter, adapter, createStandardStrategy())
}
