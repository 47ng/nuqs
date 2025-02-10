// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds.

import type { AdapterInterface, AdapterOptions } from '../../adapters/lib/defs'
import type { Options } from '../../defs'
import { compose } from '../compose'
import { debug } from '../debug'
import { error } from '../errors'
import { withResolvers, type Resolvers } from '../with-resolvers'

// edit: Safari 17 now allows 100 calls per 10 seconds, a bit better.
export function getDefaultThrottle() {
  if (typeof window === 'undefined') return 50
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // @ts-expect-error
  const isSafari = Boolean(window.GestureEvent)
  if (!isSafari) {
    return 50
  }
  try {
    const match = navigator.userAgent?.match(/version\/([\d\.]+) safari/i)
    return parseFloat(match![1]!) >= 17 ? 120 : 320
  } catch {
    return 320
  }
}

export const defaultRateLimit: NonNullable<Options['limitUrlUpdates']> = {
  method: 'throttle',
  timeMs: getDefaultThrottle()
}

// --

type UpdateMap = Map<string, string | null>
type TransitionSet = Set<React.TransitionStartFunction>
export type UpdateQueueAdapterContext = Pick<
  AdapterInterface,
  'updateUrl' | 'getSearchParamsSnapshot' | 'rateLimitFactor'
>

export type UpdateQueuePushArgs = {
  key: string
  query: string | null
  options: AdapterOptions & Pick<Options, 'startTransition'>
  throttleMs?: number
}

function getSearchParamsSnapshotFromLocation() {
  return new URLSearchParams(location.search)
}

export class ThrottledQueue {
  updateMap: UpdateMap = new Map()
  options: Required<AdapterOptions> = {
    history: 'replace',
    scroll: false,
    shallow: true
  }
  throttleMs = 0
  transitions: TransitionSet = new Set()
  resolvers: Resolvers<URLSearchParams> | null = null
  lastFlushedAt = 0

  push({
    key,
    query,
    options,
    throttleMs = defaultRateLimit.timeMs
  }: UpdateQueuePushArgs) {
    debug('[nuqs queue] Enqueueing %s=%s %O', key, query, options)
    // Enqueue update
    this.updateMap.set(key, query)
    if (options.history === 'push') {
      this.options.history = 'push'
    }
    if (options.scroll) {
      this.options.scroll = true
    }
    if (options.shallow === false) {
      this.options.shallow = false
    }
    if (options.startTransition) {
      this.transitions.add(options.startTransition)
    }
    this.throttleMs = Math.max(
      throttleMs,
      Number.isFinite(this.throttleMs) ? this.throttleMs : 0
    )
  }

  getQueuedQuery(key: string): string | null | undefined {
    return this.updateMap.get(key)
  }

  flush({
    getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation,
    rateLimitFactor = 1,
    ...adapter
  }: UpdateQueueAdapterContext): Promise<URLSearchParams> {
    if (!Number.isFinite(this.throttleMs)) {
      debug('[nuqs queue] Skipping flush due to throttleMs=Infinity')
      return Promise.resolve(getSearchParamsSnapshot())
    }
    if (this.resolvers) {
      // Flush already scheduled
      return this.resolvers.promise
    }
    if (this.updateMap.size === 0) {
      // Nothing to flush
      return Promise.resolve(getSearchParamsSnapshot())
    }
    this.resolvers = withResolvers<URLSearchParams>()
    const flushNow = () => {
      this.lastFlushedAt = performance.now()
      const [search, error] = this.applyPendingUpdates({
        ...adapter,
        getSearchParamsSnapshot
      })
      if (error === null) {
        this.resolvers!.resolve(search)
      } else {
        this.resolvers!.reject(search)
      }
      this.resolvers = null
    }
    // We run the logic on the next event loop tick to allow
    // multiple query updates to batch in the same event loop tick
    // and possibly set their own throttleMs value.
    const runOnNextTick = () => {
      const now = performance.now()
      const timeSinceLastFlush = now - this.lastFlushedAt
      const throttleMs = this.throttleMs
      const flushInMs =
        rateLimitFactor *
        Math.max(0, Math.min(throttleMs, throttleMs - timeSinceLastFlush))
      debug(
        `[nuqs queue] Scheduling flush in %f ms. Throttled at %f ms (x%f)`,
        flushInMs,
        throttleMs,
        rateLimitFactor
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
    return this.resolvers.promise
  }

  reset() {
    this.updateMap.clear()
    this.transitions.clear()
    this.options.history = 'replace'
    this.options.scroll = false
    this.options.shallow = true
    this.throttleMs = defaultRateLimit.timeMs
  }

  applyPendingUpdates(
    adapter: Required<Omit<UpdateQueueAdapterContext, 'rateLimitFactor'>>
  ): [URLSearchParams, null | unknown] {
    const { updateUrl, getSearchParamsSnapshot } = adapter
    const search = getSearchParamsSnapshot()
    if (this.updateMap.size === 0) {
      return [search, null]
    }
    // Work on a copy and clear the queue immediately
    const items = Array.from(this.updateMap.entries())
    const options = { ...this.options }
    const transitions = Array.from(this.transitions)
    // Restore defaults
    this.reset()
    debug(
      '[nuqs queue] Flushing throttle queue %O with options %O',
      items,
      options
    )
    for (const [key, value] of items) {
      if (value === null) {
        search.delete(key)
      } else {
        search.set(key, value)
      }
    }
    try {
      compose(transitions, () => {
        updateUrl(search, {
          history: options.history,
          scroll: options.scroll,
          shallow: options.shallow
        })
      })
      return [search, null]
    } catch (err) {
      // This may fail due to rate-limiting of history methods,
      // for example Safari only allows 100 updates in a 30s window.
      console.error(error(429), items.map(([key]) => key).join(), err)
      return [search, err]
    }
  }
}

export const globalThrottleQueue = new ThrottledQueue()
