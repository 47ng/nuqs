import { Options, Router } from './defs'
import { NOSYNC_MARKER } from './sync'

// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds. #wontfix
const FLUSH_RATE_LIMIT_MS = 50

type UpdateMap = Map<string, string | null>
const updateQueue: UpdateMap = new Map()
const queueOptions: Required<Options> = {
  history: 'replace',
  scroll: false,
  shallow: true
}

let lastFlushTimestamp = 0
let flushPromiseCache: Promise<URLSearchParams> | null = null

export function enqueueQueryStringUpdate<Value>(
  key: string,
  value: Value | null,
  serialize: (value: Value) => string,
  options: Options
) {
  updateQueue.set(key, value === null ? null : serialize(value))
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
export function flushToURL(router: Router) {
  if (flushPromiseCache === null) {
    flushPromiseCache = new Promise<URLSearchParams>((resolve, reject) => {
      const now = performance.now()
      const timeSinceLastFlush = now - lastFlushTimestamp
      const flushInMs = Math.max(
        0,
        Math.min(FLUSH_RATE_LIMIT_MS, FLUSH_RATE_LIMIT_MS - timeSinceLastFlush)
      )
      __DEBUG__ &&
        console.debug('[nuqs queue] Scheduling flush in %f ms', flushInMs)
      setTimeout(() => {
        lastFlushTimestamp = performance.now()
        const search = flushUpdateQueue(router)
        if (!search) {
          reject()
        } else {
          resolve(search)
        }
        flushPromiseCache = null
      }, flushInMs)
    })
  }
  return flushPromiseCache
}

function flushUpdateQueue(router: Router) {
  const search = new URLSearchParams(window.location.search)
  if (updateQueue.size === 0) {
    return search
  }
  // Work on a copy and clear the queue immediately
  const items = Array.from(updateQueue.entries())
  const options = { ...queueOptions }
  // Restore defaults
  queueOptions.history = 'replace'
  queueOptions.scroll = false
  queueOptions.shallow = true
  updateQueue.clear()
  __DEBUG__ && console.debug('[nuqs queue] Flushing queue %O', items)

  for (const [key, value] of items) {
    if (value === null) {
      search.delete(key)
    } else {
      search.set(key, value)
    }
  }

  const query = search.toString()
  const path = window.location.pathname
  const hash = window.location.hash

  // If the querystring is empty, add the pathname to clear it out,
  // otherwise using a relative URL works just fine.
  // todo: Does it when using the router with `shallow: false` on dynamic paths?
  const url = query ? `?${query}${hash}` : `${path}${hash}`
  __DEBUG__ && console.debug('[nuqs queue] Updating url: %s', url)
  try {
    if (options.shallow) {
      const updateUrl =
        options.history === 'push'
          ? window.history.pushState
          : window.history.replaceState
      updateUrl.call(
        window.history,
        window.history.state,
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
    } else {
      // Call the Next.js router to perform a network request
      const updateUrl =
        options.history === 'push' ? router.push : router.replace
      updateUrl.call(router, url, { scroll: options.scroll })
    }
    return search
  } catch (error) {
    console.error(
      // This may fail due to rate-limiting of history methods,
      // for example Safari only allows 100 updates in a 30s window.
      `useQueryState error updating URL: ${error}`
    )
    return null
  }
}
