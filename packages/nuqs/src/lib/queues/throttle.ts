// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds.

import type { AdapterInterface, AdapterOptions } from '../../adapters/lib/defs'
import type { Options } from '../../defs'
import { compose } from '../compose'
import { debug } from '../debug'
import { error } from '../errors'
import { timeout } from '../timeout'
import { withResolvers, type Resolvers } from '../with-resolvers'
import { defaultRateLimit } from './rate-limiting'

type UpdateMap = Map<string, string | null>
type TransitionSet = Set<React.TransitionStartFunction>
export type UpdateQueueAdapterContext = Pick<
  AdapterInterface,
  | 'updateUrl'
  | 'getSearchParamsSnapshot'
  | 'rateLimitFactor'
  | 'autoResetQueueOnUpdate'
>

export type UpdateQueuePushArgs = {
  key: string
  query: string | null
  options: AdapterOptions & Pick<Options, 'startTransition'>
}

export function getSearchParamsSnapshotFromLocation() {
  return new URLSearchParams(location.search)
}

export class ThrottledQueue {
  updateMap: UpdateMap = new Map()
  options: Required<AdapterOptions> = {
    history: 'replace',
    scroll: false,
    shallow: true
  }
  timeMs = defaultRateLimit.timeMs
  transitions: TransitionSet = new Set()
  resolvers: Resolvers<URLSearchParams> | null = null
  controller = new AbortController()
  lastFlushedAt = 0

  push(
    { key, query, options }: UpdateQueuePushArgs,
    timeMs = defaultRateLimit.timeMs
  ) {
    debug('[nuqs gtq] Enqueueing %s=%s %O', key, query, options)
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
    this.timeMs = Math.max(
      timeMs,
      Number.isFinite(this.timeMs) ? this.timeMs : 0
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
    if (!Number.isFinite(this.timeMs)) {
      debug('[nuqs gtq] Skipping flush due to throttleMs=Infinity')
      return Promise.resolve(getSearchParamsSnapshot())
    }
    if (this.resolvers) {
      // Flush already scheduled
      return this.resolvers.promise
    }
    this.resolvers = withResolvers<URLSearchParams>()
    const flushNow = () => {
      this.lastFlushedAt = performance.now()
      const [search, error] = this.applyPendingUpdates({
        ...adapter,
        autoResetQueueOnUpdate: adapter.autoResetQueueOnUpdate ?? true,
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
      const timeMs = this.timeMs
      const flushInMs =
        rateLimitFactor *
        Math.max(0, Math.min(timeMs, timeMs - timeSinceLastFlush))
      debug(
        `[nuqs gtq] Scheduling flush in %f ms. Throttled at %f ms (x%f)`,
        flushInMs,
        timeMs,
        rateLimitFactor
      )
      if (flushInMs === 0) {
        // Since we're already in the "next tick" from queued updates,
        // no need to do setTimeout(0) here.
        flushNow()
      } else {
        timeout(flushNow, flushInMs, this.controller.signal)
      }
    }
    setTimeout(runOnNextTick, 0)
    return this.resolvers.promise
  }

  abort() {
    this.controller.abort()
    this.controller = new AbortController()
    // todo: Better abort handling
    this.resolvers?.resolve(new URLSearchParams())
    this.resolvers = null
    return this.reset()
  }

  reset() {
    const queuedKeys = Array.from(this.updateMap.keys())
    debug(
      '[nuqs gtq] Resetting queue %s',
      JSON.stringify(Object.fromEntries(this.updateMap))
    )
    this.updateMap.clear()
    this.transitions.clear()
    this.options.history = 'replace'
    this.options.scroll = false
    this.options.shallow = true
    this.timeMs = defaultRateLimit.timeMs
    return queuedKeys
  }

  applyPendingUpdates(
    adapter: Required<Omit<UpdateQueueAdapterContext, 'rateLimitFactor'>>
  ): [URLSearchParams, null | unknown] {
    const { updateUrl, getSearchParamsSnapshot } = adapter
    const search = getSearchParamsSnapshot()
    debug(
      `[nuqs gtq] Applying %d pending update(s) on top of %s`,
      this.updateMap.size,
      search.toString()
    )
    if (this.updateMap.size === 0) {
      return [search, null]
    }
    // Work on a copy and clear the queue immediately
    const items = Array.from(this.updateMap.entries())
    const options = { ...this.options }
    const transitions = Array.from(this.transitions)
    // Let the adapters choose whether to reset, as it depends on how they
    // handle concurrent rendering (see the life-and-death.cy.ts e2e test).
    if (adapter.autoResetQueueOnUpdate) {
      this.reset()
    }
    debug('[nuqs gtq] Flushing queue %O with options %O', items, options)
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
