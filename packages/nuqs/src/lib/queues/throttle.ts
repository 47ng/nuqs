import type { AdapterInterface, AdapterOptions } from '../../adapters/lib/defs'
import type { Options } from '../../defs'

import { debug } from '../debug'
import { createEmitter, type Emitter } from '../emitter'
import { error429, error502 } from '../errors'
import { globalSingleton } from '../global-singleton'
import { write, type Query } from '../search-params'
import { timeout } from '../timeout'
import { withResolvers, type Resolvers } from '../with-resolvers'
import { defaultRateLimit } from './rate-limiting'

declare global {
  interface History {
    nuqs?: {
      version?: string
      adapters?: string[]
      lastFlushedAt?: number
    }
  }
}

// `version` is claimed by the history patch (adapters/lib/patch-history.ts),
// keeping mount-order precedence for the version-skew detection there.
// `adapters` is seeded here: older nuqs copies sharing the slot assume it
// exists whenever the slot does, and would crash on `adapters.push`.
function getHistorySlot(
  fallback: NonNullable<History['nuqs']>
): NonNullable<History['nuqs']> {
  if (typeof history === 'undefined') {
    return fallback
  }
  return (history.nuqs ??= { adapters: [] })
}

type UpdateMap = Map<string, Query | null>
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
  query: Query | null
  options: AdapterOptions & Pick<Options, 'startTransition'>
}

export function getSearchParamsSnapshotFromLocation(): URLSearchParams {
  return new URLSearchParams(location.search)
}

export class ThrottledQueue {
  updateMap: UpdateMap = new Map()
  // Notifies subscribers (per url key) of any change to the pending update
  // overlay, so hooks re-read their raw optimistic value. Debounce queues
  // (which hold the other half of the overlay) emit into it too.
  sync: Emitter<Record<string, undefined>> = createEmitter()
  options: Required<AdapterOptions> = {
    history: 'replace',
    scroll: false,
    shallow: true
  }
  timeMs: number = defaultRateLimit.timeMs
  transitions: TransitionSet = new Set()
  resolvers: Resolvers<URLSearchParams> | null = null
  controller: AbortController | null = null
  resetQueueOnNextPush = false
  // Fallback when the History API is not available (SSR)
  localSlot: NonNullable<History['nuqs']> = {}

  // There is only one rate-limit budget per page, shared by every queue
  // instance and every copy of this module: account for it on `history`.
  get lastFlushedAt(): number {
    return getHistorySlot(this.localSlot).lastFlushedAt ?? 0
  }
  set lastFlushedAt(value: number) {
    getHistorySlot(this.localSlot).lastFlushedAt = value
  }

  push(
    { key, query, options }: UpdateQueuePushArgs,
    timeMs: number = defaultRateLimit.timeMs
  ): void {
    if (this.resetQueueOnNextPush) {
      // The entries cleared here were successfully flushed to the URL
      // (the flag is only set on flush success), so like the flush-time
      // reset below, notifying would revert optimistic state on adapters
      // whose committed view lags the URL update.
      this.reset({ notify: false })
      this.resetQueueOnNextPush = false
    }
    debug(7, key, query, options)
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
    // Keep the longest throttle value, except after an Infinity push: that one
    // defers the flush, and the next push (finite or not) replaces it, which
    // lets the deferred entries flush with the new value.
    if (!Number.isFinite(this.timeMs) || timeMs > this.timeMs) {
      this.timeMs = timeMs
    }
    this.sync.emit(key)
  }

  getQueuedQuery(key: string): Query | null | undefined {
    return this.updateMap.get(key)
  }

  getPendingPromise({
    getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation
  }: UpdateQueueAdapterContext): Promise<URLSearchParams> {
    return this.resolvers?.promise ?? Promise.resolve(getSearchParamsSnapshot())
  }

  flush(
    {
      getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation,
      rateLimitFactor = 1,
      ...adapter
    }: UpdateQueueAdapterContext,
    processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams
  ): Promise<URLSearchParams> {
    this.controller ??= new AbortController()
    if (!Number.isFinite(this.timeMs)) {
      debug(8)
      return Promise.resolve(getSearchParamsSnapshot())
    }
    if (this.resolvers) {
      // Flush already scheduled
      return this.resolvers.promise
    }
    this.resolvers = withResolvers<URLSearchParams>()
    const flushNow = () => {
      this.lastFlushedAt = performance.now()
      const [search, error] = this.applyPendingUpdates(
        adapter.updateUrl,
        getSearchParamsSnapshot,
        adapter.autoResetQueueOnUpdate ?? true,
        processUrlSearchParams
      )
      if (error === null) {
        this.resolvers!.resolve(search)
        this.resetQueueOnNextPush = true
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
        rateLimitFactor * Math.max(0, timeMs - timeSinceLastFlush)
      debug(9, flushInMs, timeMs, rateLimitFactor)
      if (flushInMs === 0) {
        // Since we're already in the "next tick" from queued updates,
        // no need to do setTimeout(0) here.
        flushNow()
      } else {
        timeout(flushNow, flushInMs, this.controller!.signal)
      }
    }
    timeout(runOnNextTick, 0, this.controller.signal)
    return this.resolvers.promise
  }

  abort(): string[] {
    this.controller?.abort()
    this.controller = new AbortController()
    // todo: Better abort handling
    this.resolvers?.resolve(new URLSearchParams())
    this.resolvers = null
    return this.reset()
  }

  // `notify: false` is reserved for two cases:
  // - render-phase resets (NavigationSpy), where notifying would schedule
  //   updates on other components mid-render;
  // - clearing already-flushed entries (flush & deferred reset-on-push),
  //   where the committed search params carry the flushed values.
  // Every other overlay mutation must notify, otherwise a stale overlay
  // value would keep shadowing a newer committed one. The testing adapter's
  // mount-time resetQueues() also runs during render with notifications:
  // safe only because its subscribers don't exist yet at that point.
  reset({ notify = true }: { notify?: boolean } = {}): string[] {
    const queuedKeys = Array.from(this.updateMap.keys())
    debug(10, JSON.stringify(Object.fromEntries(this.updateMap)))
    this.updateMap.clear()
    this.transitions.clear()
    this.options = {
      history: 'replace',
      scroll: false,
      shallow: true
    }
    this.timeMs = defaultRateLimit.timeMs
    if (notify) {
      for (const key of queuedKeys) {
        this.sync.emit(key)
      }
    }
    return queuedKeys
  }

  applyPendingUpdates(
    updateUrl: UpdateQueueAdapterContext['updateUrl'],
    getSearchParamsSnapshot: NonNullable<
      UpdateQueueAdapterContext['getSearchParamsSnapshot']
    >,
    autoResetQueueOnUpdate: boolean,
    processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams
  ): [URLSearchParams, null | unknown] {
    let search = getSearchParamsSnapshot()
    debug(11, this.updateMap.size, search.toString())
    if (this.updateMap.size === 0) {
      return [search, null]
    }
    // Work on a copy and clear the queue immediately
    const items = Array.from(this.updateMap)
    const options = { ...this.options }
    const transitions = Array.from(this.transitions)
    // Let the adapters choose whether to reset, as it depends on how they
    // handle concurrent rendering (see the life-and-death.cy.ts e2e test).
    // `notify: false`: after a successful flush the committed search params
    // carry the flushed values, so the merged raw value is unchanged.
    // Notifying would revert optimistic state on adapters whose committed
    // view lags the URL update (next/pages) or never reflects it
    // (memory-less testing adapter). The error path below compensates.
    if (autoResetQueueOnUpdate) {
      this.reset({ notify: false })
    }
    debug(12, items, options)
    for (const [key, value] of items) {
      if (value === null) {
        search.delete(key)
      } else {
        search = write(search, key, value)
      }
    }
    let failure = error502
    try {
      if (processUrlSearchParams) {
        search = processUrlSearchParams(search)
      }
      failure = error429
      // This may fail due to rate-limiting of history methods,
      // for example Safari only allows 100 updates in a 30s window.
      let runUpdate = () => updateUrl(search, options)
      for (let i = transitions.length - 1; i >= 0; i--) {
        const transition = transitions[i]!
        const next = runUpdate
        runUpdate = () => transition(next)
      }
      runUpdate()
      return [search, null]
    } catch (err) {
      const keys = items.map(([key]) => key)
      console.error(failure, keys.join(), err)
      this.reset({ notify: false })
      for (const key of keys) {
        this.sync.emit(key)
      }
      return [search, err]
    }
  }
}

export const globalThrottleQueue: ThrottledQueue = globalSingleton(
  'throttle-queue',
  () => new ThrottledQueue()
)
