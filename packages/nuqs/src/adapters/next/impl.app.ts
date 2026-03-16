import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import {
  startTransition,
  useCallback,
  useEffect,
  useOptimistic,
  useRef
} from 'react'
import { debug } from '../../lib/debug'
import {
  resetQueues,
  setQueueResetMutex,
  spinQueueResetMutex
} from '../../lib/queues/reset'
import { globalThrottleQueue } from '../../lib/queues/throttle'
import { renderQueryString } from '../../lib/url-encoding'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'
import {
  historyUpdateMarker,
  markHistoryAsPatched,
  shouldPatchHistory
} from '../lib/patch-history'

// See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
// and https://github.com/47ng/nuqs/discussions/960#discussioncomment-12699171
const NUM_HISTORY_CALLS_PER_UPDATE = 3

function onPopState() {
  setQueueResetMutex(0)
  resetQueues()
}

function onHistoryStateUpdate() {
  // Doing this after the end of the current render work because of the error:
  // "useInsertionEffect cannot schedule updates"
  // (resetting the queue causes the useSyncExternalStore of queued queries
  // to be marked for rendering)
  // The useInsertionEffect in question is the one in the Next.js app router core
  //  dealing with history API calls.
  spinQueueResetMutex(() => {
    queueMicrotask(resetQueues)
  })
}

function patchHistory() {
  if (!shouldPatchHistory('next/app')) {
    return
  }
  const originalReplaceState = history.replaceState
  const originalPushState = history.pushState
  // replaceState: nuqs's own calls pass the marker (stripped below).
  // Next.js cascade calls (e.g. useInsertionEffect patching history state)
  // also use replaceState but without the marker — we skip onHistoryStateUpdate
  // for all replaceState calls to avoid triggering resetQueues during cascades.
  history.replaceState = function nuqs_replaceState(state, marker, url) {
    return originalReplaceState.call(
      history,
      state,
      marker === historyUpdateMarker ? '' : marker,
      url
    )
  }
  // pushState: nuqs's own calls pass the marker (stripped below).
  // External navigation (link clicks, router.push) uses pushState without
  // the marker — this should trigger queue reset via onHistoryStateUpdate.
  history.pushState = function nuqs_pushState(state, marker, url) {
    if (marker !== historyUpdateMarker) {
      onHistoryStateUpdate()
    }
    return originalPushState.call(
      history,
      state,
      marker === historyUpdateMarker ? '' : marker,
      url
    )
  }
  markHistoryAsPatched('next/app')
}

// Detect user navigation (clicking links, router calls)
// and reset the queues when that happens.
export function NavigationSpy() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  // Synchronous pathname-based reset for cross-page navigation.
  // This ensures the queue is cleared before the new page's components render,
  // providing a stronger guarantee than the async marker-based mechanism.
  if (prevPathname.current !== pathname) {
    prevPathname.current = pathname
    globalThrottleQueue.reset()
  }
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
    startTransition(() => {
      if (!options.shallow) {
        setOptimisticSearchParams(search)
      }
      const url = renderURL(search)
      debug('[nuqs next/app] Updating url: %s', url)
      // First, update the URL locally without triggering a network request,
      // this allows keeping a reactive URL if the network is slow.
      const updateMethod =
        options.history === 'push' ? history.pushState : history.replaceState
      // The mutex prevents resetQueues from firing during the pushState
      // cascade that may follow from router.replace in non-shallow mode.
      setQueueResetMutex(options.shallow ? 0 : NUM_HISTORY_CALLS_PER_UPDATE)
      updateMethod.call(
        history,
        // In next@14.1.0, useSearchParams becomes reactive to shallow updates,
        // but only if passing `null` as the history state.
        null,
        historyUpdateMarker,
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
