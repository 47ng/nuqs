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
  // replaceState: nuqs's own calls carry the marker (stripped before
  // reaching the browser). Next.js cascade calls (e.g. useInsertionEffect
  // patching history state after our update) also use replaceState but
  // WITHOUT the marker, and there is no reliable way to distinguish them
  // from external replaceState calls. We skip onHistoryStateUpdate for
  // all replaceState to avoid cascades prematurely resetting the queue.
  // Trade-off: external history.replaceState() on the same pathname won't
  // cancel pending nuqs work. Cross-page navigations are still covered
  // by the pathname-based reset in NavigationSpy below, and pushState-
  // based navigations (Link clicks, router.push) are covered by the
  // pushState handler.
  history.replaceState = function nuqs_replaceState(state, marker, url) {
    return originalReplaceState.call(
      history,
      state,
      marker === historyUpdateMarker ? '' : marker,
      url
    )
  }
  // pushState: nuqs's own calls carry the marker (stripped below).
  // External navigation (link clicks, router.push) uses pushState without
  // the marker — this triggers queue reset via onHistoryStateUpdate.
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
  // Intentionally in the render phase (not an effect): the queue must be
  // cleared before the new page's components render so they don't read
  // stale values via getQueuedQuery. This is safe because:
  // - In StrictMode the second render sees prevPathname === pathname (no-op)
  // - globalThrottleQueue.reset() is idempotent
  // - No React state updates are triggered (no useSyncExternalStore emissions)
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
      // Since replaceState calls are not monitored (see patchHistory above),
      // the mutex is not needed to absorb cascade calls — they go undetected.
      // Set to 0 so that the next external pushState immediately resets.
      setQueueResetMutex(0)
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
