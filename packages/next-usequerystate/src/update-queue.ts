import { debug } from './debug'
import type { Options, Router } from './defs'
import { error } from './errors'
import { NOSYNC_MARKER } from './sync'
import { renderQueryString } from './url-encoding'
import { getDefaultThrottle } from './utils'

export const FLUSH_RATE_LIMIT_MS = getDefaultThrottle()

type UpdateMap = Map<string, string | null>
const updateQueue: UpdateMap = new Map()
const queueOptions: Required<Options> = {
  history: 'replace',
  scroll: false,
  shallow: true,
  throttleMs: FLUSH_RATE_LIMIT_MS
}

let lastFlushTimestamp = 0
let flushPromiseCache: Promise<URLSearchParams> | null = null

export function enqueueQueryStringUpdate<Value>(
  key: string,
  value: Value | null,
  serialize: (value: Value) => string,
  options: Options
) {
  const serializedOrNull = value === null ? null : serialize(value)
  debug('[nuqs queue] Enqueueing %s=%s %O', key, serializedOrNull, options)
  updateQueue.set(key, serializedOrNull)
  // Any item can override an option for the whole batch of updates
  if (options.history === 'push') {
    queueOptions.history = 'push'
  }
  if (options.scroll) {
    queueOptions.scroll = true
  }
  if (options.shallow === false) {
    queueOptions.shallow = false
  }
  queueOptions.throttleMs = Math.max(
    options.throttleMs ?? FLUSH_RATE_LIMIT_MS,
    Number.isFinite(queueOptions.throttleMs) ? queueOptions.throttleMs : 0
  )
}

export function getQueuedValue(key: string) {
  return updateQueue.get(key) ?? null
}

/**
 * Eventually flush the update queue to the URL query string.
 *
 * This takes care of throttling to avoid hitting browsers limits
 * on calls to the history pushState/replaceState APIs, and defers
 * the call so that individual query state updates can be batched
 * when running in the same event loop tick.
 *
 * @returns a Promise to the URLSearchParams that have been applied.
 */
export function scheduleFlushToURL(router: Router) {
  if (flushPromiseCache === null) {
    flushPromiseCache = new Promise<URLSearchParams>((resolve, reject) => {
      if (!Number.isFinite(queueOptions.throttleMs)) {
        debug('[nuqs queue] Skipping flush due to throttleMs=Infinity')
        resolve(new URLSearchParams(location.search))
        // Let the promise be returned before clearing the cached value
        setTimeout(() => {
          flushPromiseCache = null
        }, 0)
        return
      }
      function flushNow() {
        lastFlushTimestamp = performance.now()
        const [search, error] = flushUpdateQueue(router)
        if (error === null) {
          resolve(search)
        } else {
          reject(search)
        }
        flushPromiseCache = null
      }
      // We run the logic on the next event loop tick to allow
      // multiple query updates to set their own throttleMs value.
      function runOnNextTick() {
        const now = performance.now()
        const timeSinceLastFlush = now - lastFlushTimestamp
        const throttleMs = queueOptions.throttleMs
        const flushInMs = Math.max(
          0,
          Math.min(throttleMs, throttleMs - timeSinceLastFlush)
        )
        debug(
          '[nuqs queue] Scheduling flush in %f ms. Throttled at %f ms',
          flushInMs,
          throttleMs
        )
        if (flushInMs === 0) {
          // Since we're already in the "next tick" from queued updates,
          // no need to do setTimeout(0) here.
          flushNow()
        } else {
          setTimeout(flushNow, flushInMs)
        }
      }
      setTimeout(runOnNextTick, 0)
    })
  }
  return flushPromiseCache
}

function flushUpdateQueue(router: Router): [URLSearchParams, null | unknown] {
  const search = new URLSearchParams(location.search)
  if (updateQueue.size === 0) {
    return [search, null]
  }
  // Work on a copy and clear the queue immediately
  const items = Array.from(updateQueue.entries())
  const options = { ...queueOptions }
  // Restore defaults
  updateQueue.clear()
  queueOptions.history = 'replace'
  queueOptions.scroll = false
  queueOptions.shallow = true
  queueOptions.throttleMs = FLUSH_RATE_LIMIT_MS
  debug('[nuqs queue] Flushing queue %O with options %O', items, options)
  for (const [key, value] of items) {
    if (value === null) {
      search.delete(key)
    } else {
      search.set(key, value)
    }
  }
  const url = renderURL(search)
  debug('[nuqs queue] Updating url: %s', url)

  try {
    // First, update the URL locally without triggering a network request,
    // this allows keeping a reactive URL if the network is slow.
    const updateMethod =
      options.history === 'push' ? history.pushState : history.replaceState
    updateMethod.call(
      history,
      history.state,
      // Our own updates have a marker to prevent syncing
      // when the URL changes (we've already sync'd them up
      // via `emitter.emit(key, newValue)` above, without
      // going through the parsers).
      NOSYNC_MARKER,
      url
    )
    if (options.scroll) {
      window.scrollTo(0, 0)
    }
    if (!options.shallow) {
      // Call the Next.js router to perform a network request
      // and re-render server components.
      router.replace(url, {
        scroll: false,
        // @ts-expect-error - pages router fix, but not exposed in navigation types
        shallow: false
      })
    }
    return [search, null]
  } catch (err) {
    // This may fail due to rate-limiting of history methods,
    // for example Safari only allows 100 updates in a 30s window.
    console.error(error(429), items.map(([key]) => key).join(), err)
    return [search, error]
  }
}

function renderURL(search: URLSearchParams) {
  const query = renderQueryString(search)
  const href = location.href.split('?')[0]
  const hash = location.hash
  if (history.state.__N === true) {
    // Pages router: always use a full path to handle dynamic routes,
    // but strip the basePath to avoid recursively applying it.
    // @ts-expect-error - Not exposed in types
    const basePath = window?.next?.router?.basePath ?? ''
    const path = location.pathname.slice(basePath.length)
    const base = process.env.__NEXT_WINDOW_HISTORY_SUPPORT ? href : path
    return query ? `${base}?${query}${hash}` : `${base}${hash}`
  } else {
    // App router
    // From 12.0.3-canary.6, with the experimental windowHistorySupport flag,
    // a valid URL is required, so prepend the href (but without the query string)
    return query ? `${href}?${query}${hash}` : `${href}${hash}`
  }
}
