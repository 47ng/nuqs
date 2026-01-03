import { startTransition, useCallback, useEffect, useState } from 'react'
import { debug } from '../../lib/debug'
import type { Emitter } from '../../lib/emitter'
import { createEmitter } from '../../lib/emitter'
import {
  resetQueues,
  setQueueResetMutex,
  spinQueueResetMutex
} from '../../lib/queues/reset'
import { renderQueryString } from '../../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './context'
import type { AdapterInterface, AdapterOptions } from './defs'
import {
  constructHash,
  getPathnameFromHash,
  getSearchFromHash
} from './hash-router-utils'
import { applyChange, filterSearchParams } from './key-isolation'
import {
  historyUpdateMarker,
  markHistoryAsPatched,
  shouldPatchHistory,
  type SearchParamsSyncEmitterEvents
} from './patch-history'

type UseSearchParams = (initial: URLSearchParams) => [URLSearchParams, {}]

type CreateHashRouterBasedAdapterArgs = {
  adapter: string
  useSearchParams: UseSearchParams
}

/**
 * Get URLSearchParams from a hash-based URL.
 * In HashRouter, the search params are inside the hash fragment.
 * @example getSearchParamsFromHash("#/page?foo=bar") => URLSearchParams { foo: "bar" }
 */
function getSearchParamsFromHash(hash: string): URLSearchParams {
  const search = getSearchFromHash(hash)
  return new URLSearchParams(search)
}

/**
 * Creates a HashRouter-based adapter for nuqs.
 *
 * This adapter handles React Router's HashRouter where both pathname and search params
 * are stored in the URL hash fragment (e.g., `/#/page?foo=bar`).
 *
 * @param args - Configuration object
 * @param args.adapter - Adapter identifier string
 * @param args.useSearchParams - React Router's useSearchParams hook
 * @returns Object containing NuqsAdapter provider and useOptimisticSearchParams hook
 *
 * @example
 * ```tsx
 * const adapter = createHashRouterBasedAdapter({
 *   adapter: 'react-router-v6-hash',
 *   useSearchParams
 * })
 * ```
 */
export function createHashRouterBasedAdapter({
  adapter,
  useSearchParams
}: CreateHashRouterBasedAdapterArgs): {
  NuqsAdapter: AdapterProvider
  useOptimisticSearchParams: () => URLSearchParams
} {
  const emitter = createEmitter<SearchParamsSyncEmitterEvents>()

  function useNuqsHashRouterBasedAdapter(
    watchKeys: string[]
  ): AdapterInterface {
    const searchParams = useOptimisticSearchParams(watchKeys)
    const updateUrl = useCallback(
      (search: URLSearchParams, options: AdapterOptions) => {
        startTransition(() => {
          emitter.emit('update', search)
        })
        // In HashRouter, we need to preserve the pathname within the hash
        // and only update the search params portion
        const currentPathname = getPathnameFromHash(location.hash)
        const queryString = renderQueryString(search)
        const newHash = constructHash(currentPathname, queryString)

        // Create new URL with updated hash
        const url = new URL(location.href)
        url.hash = newHash
        // Clear any search params from the main URL (they belong in the hash)
        url.search = ''

        debug(`[nuqs ${adapter}] Updating url: %s`, url)
        // Note: HashRouter is client-side only (hash is never sent to server),
        // so shallow: false has no effect - we always update via the History API.
        const updateMethod =
          options.history === 'push' ? history.pushState : history.replaceState
        setQueueResetMutex(1)
        updateMethod.call(
          history,
          history.state, // Maintain the history state
          historyUpdateMarker,
          url
        )
        if (options.scroll) {
          window.scrollTo(0, 0)
        }
      },
      []
    )
    return {
      searchParams,
      updateUrl,
      autoResetQueueOnUpdate: false
    }
  }

  function useOptimisticSearchParams(
    watchKeys: string[] = []
  ): URLSearchParams {
    // In HashRouter, useSearchParams already returns params from the hash,
    // but we need to read directly from location.hash for consistency
    const [serverSearchParams] = useSearchParams(
      // Note: this will only be taken into account the first time the hook is called,
      // and cached for subsequent calls, causing problems when mounting components
      // after shallow updates have occurred.
      typeof location === 'undefined'
        ? new URLSearchParams()
        : getSearchParamsFromHash(location.hash)
    )
    const [searchParams, setSearchParams] = useState(() => {
      return typeof location === 'undefined'
        ? // We use this on the server to SSR with the correct search params.
          // Note: In HashRouter, server-side hash is typically empty.
          filterSearchParams(serverSearchParams, watchKeys, true)
        : // Since useSearchParams isn't reactive to shallow changes,
          // it doesn't pick up changes in the URL on mount, so we need to initialise
          // the reactive state with the current URL instead.
          filterSearchParams(
            getSearchParamsFromHash(location.hash),
            watchKeys,
            false // No need for a copy here
          )
    })
    useEffect(() => {
      function onNavigationChange() {
        setSearchParams(
          applyChange(getSearchParamsFromHash(location.hash), watchKeys, false)
        )
      }
      function onEmitterUpdate(search: URLSearchParams) {
        setSearchParams(applyChange(search, watchKeys, true))
      }
      emitter.on('update', onEmitterUpdate)
      // Listen to both popstate (back/forward) and hashchange (hash navigation)
      window.addEventListener('popstate', onNavigationChange)
      window.addEventListener('hashchange', onNavigationChange)
      return () => {
        emitter.off('update', onEmitterUpdate)
        window.removeEventListener('popstate', onNavigationChange)
        window.removeEventListener('hashchange', onNavigationChange)
      }
    }, [watchKeys.join('&')])
    return searchParams
  }

  /**
   * Sync shallow updates of the URL with the useOptimisticSearchParams hook.
   *
   * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
   * If third party code updates the History API directly, use this function to
   * enable useOptimisticSearchParams to react to those changes.
   *
   * Note: this is actually required in React Router frameworks to follow Link navigations.
   */
  patchHistoryForHashRouter(emitter, adapter)

  return {
    NuqsAdapter: createAdapterProvider(useNuqsHashRouterBasedAdapter),
    useOptimisticSearchParams
  }
}

/**
 * HashRouter-specific history patching.
 * Similar to patchHistory but extracts search params from the hash fragment.
 */
function patchHistoryForHashRouter(
  emitter: Emitter<SearchParamsSyncEmitterEvents>,
  adapter: string
): void {
  if (!shouldPatchHistory(adapter)) {
    return
  }
  // Track the last search string we've seen (from within the hash)
  let lastSearchSeen =
    typeof location === 'object' ? getSearchFromHash(location.hash) : ''

  emitter.on('update', search => {
    const searchString = search.toString()
    lastSearchSeen = searchString.length ? '?' + searchString : ''
  })

  window.addEventListener('popstate', () => {
    lastSearchSeen = getSearchFromHash(location.hash)
    resetQueues()
  })

  window.addEventListener('hashchange', () => {
    lastSearchSeen = getSearchFromHash(location.hash)
    resetQueues()
  })

  debug(
    '[nuqs %s] Patching history for HashRouter (%s adapter)',
    '0.0.0-inject-version-here',
    adapter
  )

  /**
   * Extract hash fragment from URL (URL object or string).
   * Returns null if no hash is present or if extraction fails.
   */
  function extractHashFromUrl(url: URL | string): string | null {
    try {
      if (url instanceof URL) {
        return url.hash
      }
      if (typeof url === 'string' && url.includes('#')) {
        return url.slice(url.indexOf('#'))
      }
      return null
    } catch (error) {
      debug(`[nuqs ${adapter}] Error extracting hash from URL:`, error)
      return null
    }
  }

  function sync(url: URL | string) {
    spinQueueResetMutex()

    // Extract hash from URL
    const hash = extractHashFromUrl(url)
    if (!hash) {
      // No hash in URL, nothing to sync
      return
    }

    try {
      const newSearch = getSearchFromHash(hash)
      if (newSearch === lastSearchSeen) {
        return
      }
      emitter.emit('update', getSearchParamsFromHash(hash))
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
