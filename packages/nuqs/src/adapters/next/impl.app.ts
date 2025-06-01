import { useRouter, useSearchParams } from 'next/navigation.js'
import { startTransition, useCallback, useEffect, useOptimistic } from 'react'
import { debug } from '../../lib/debug'
import { debounceController } from '../../lib/queues/debounce'
import { resetQueues } from '../../lib/queues/reset'
import { globalThrottleQueue } from '../../lib/queues/throttle'
import { renderQueryString } from '../../lib/url-encoding'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'
import { markHistoryAsPatched, shouldPatchHistory } from '../lib/patch-history'

// See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
// and https://github.com/47ng/nuqs/discussions/960#discussioncomment-12699171
const NUM_HISTORY_CALLS_PER_UPDATE = 3

let mutex = 0

function onPopState() {
  mutex = 0
  resetQueues()
}

function onHistoryStateUpdate() {
  mutex--
  if (mutex <= 0) {
    mutex = 0 // Don't let values become too negatively large and wrap around
    // Doing this after the end of the current render work because of the error:
    // "useInsertionEffect cannot schedule updates"
    // (resetting the queue causes the useSyncExternalStore of queued queries
    // to be marked for rendering)
    // The useInsertionEffect in question is the one in the Next.js app router core
    //  dealing with history API calls.
    queueMicrotask(resetQueues)
  }
}

function patchHistory() {
  if (!shouldPatchHistory('next/app')) {
    return
  }
  const originalReplaceState = history.replaceState
  const originalPushState = history.pushState
  history.replaceState = function nuqs_replaceState(state, title, url) {
    onHistoryStateUpdate()
    return originalReplaceState.call(history, state, title, url)
  }
  history.pushState = function nuqs_pushState(state, title, url) {
    onHistoryStateUpdate()
    return originalPushState.call(history, state, title, url)
  }
  markHistoryAsPatched('next/app')
}

// Detect user navigation (clicking links, router calls)
// and reset the queues when that happens.
export function NavigationSpy() {
  useEffect(() => {
    patchHistory()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  return null
}

export function useNuqsNextAppRouterAdapter(): AdapterInterface {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [optimisticSearchParams, setOptimisticSearchParams] =
    useOptimistic<URLSearchParams>(searchParams)
  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
    const queuedThrottledKeys = globalThrottleQueue.reset()
    const resetKeysToSync = queuedThrottledKeys.concat(
      Array.from(debounceController.queuedQuerySync.all.keys())
    )
    startTransition(() => {
      if (!options.shallow) {
        setOptimisticSearchParams(search)
        for (const key of resetKeysToSync) {
          debounceController.queuedQuerySync.emit(key)
        }
      }
      const url = renderURL(search)
      debug('[nuqs next/app] Updating url: %s', url)
      // First, update the URL locally without triggering a network request,
      // this allows keeping a reactive URL if the network is slow.
      const updateMethod =
        options.history === 'push' ? history.pushState : history.replaceState
      mutex = NUM_HISTORY_CALLS_PER_UPDATE
      updateMethod.call(
        history,
        // In next@14.1.0, useSearchParams becomes reactive to shallow updates,
        // but only if passing `null` as the history state.
        null,
        '',
        url
      )
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (!options.shallow) {
        // Call the Next.js router to perform a network request
        // and re-render server components.
        router.replace(url, {
          scroll: false
        })
      }
    })
  }, [])
  return {
    searchParams: optimisticSearchParams,
    updateUrl,
    rateLimitFactor: NUM_HISTORY_CALLS_PER_UPDATE,
    autoResetQueueOnUpdate: false
  }
}

function renderURL(search: URLSearchParams) {
  const { origin, pathname, hash } = location
  return origin + pathname + renderQueryString(search) + hash
}
