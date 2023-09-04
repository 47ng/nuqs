import { HistoryOptions } from './defs'
import { NOSYNC_MARKER } from './sync'

// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds. #wontfix
const FLUSH_RATE_LIMIT_MS = 50

type UpdateQueueItem = {
  key: string
  value: string | null
  history: HistoryOptions
}

let updateQueue: UpdateQueueItem[] = []
let lastFlushTimestamp = 0

export function enqueueQueryStringUpdate<Value>(
  key: string,
  value: Value | null,
  serialize: (value: Value) => string,
  history: HistoryOptions
) {
  const queueItem: UpdateQueueItem = {
    key,
    value: value === null ? null : serialize(value),
    history
  }
  // console.debug('Pushing to queue %O', queueItem)
  updateQueue.push(queueItem)
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
export function flushToURL() {
  return new Promise<URLSearchParams>((resolve, reject) => {
    const now = performance.now()
    const timeSinceLastFlush = now - lastFlushTimestamp
    const flushInMs = Math.max(
      0,
      Math.min(FLUSH_RATE_LIMIT_MS, FLUSH_RATE_LIMIT_MS - timeSinceLastFlush)
    )
    // console.debug('Scheduling flush in %f ms', flushInMs)
    setTimeout(() => {
      lastFlushTimestamp = performance.now()
      const search = flushUpdateQueue()
      if (!search) {
        reject()
      } else {
        resolve(search)
      }
    }, flushInMs)
  })
}

function flushUpdateQueue() {
  const search = new URLSearchParams(window.location.search)
  if (updateQueue.length === 0) {
    return search
  }
  // Work on a copy and clear the queue immediately
  const items = updateQueue.slice()
  updateQueue = []
  // console.debug('Flushing queue %O', items)

  // By default, history mode is set to 'replace',
  // unless at least one item is set to 'push',
  // in which case push takes precedence.
  let history: HistoryOptions = 'replace'
  for (const item of items) {
    if (item.value === null) {
      search.delete(item.key)
    } else {
      search.set(item.key, item.value)
    }
    if (item.history === 'push') {
      history = 'push'
    }
  }
  const query = search.toString()
  const path = window.location.pathname
  const hash = window.location.hash
  const updateUrl =
    history === 'push' ? window.history.pushState : window.history.replaceState

  // If the querystring is empty, add the pathname to clear it out,
  // otherwise using a relative URL works just fine.
  const url = query ? `?${query}${hash}` : `${path}${hash}`
  try {
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
