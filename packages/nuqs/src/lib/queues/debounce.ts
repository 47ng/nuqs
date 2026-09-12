import { debug } from '../debug'
import { globalSingleton } from '../global-singleton'
import type { Query } from '../search-params'
import { timeout } from '../timeout'
import { withResolvers, type Resolvers } from '../with-resolvers'
import {
  getSearchParamsSnapshotFromLocation,
  globalThrottleQueue,
  ThrottledQueue,
  type UpdateQueueAdapterContext,
  type UpdateQueuePushArgs
} from './throttle'

export class DebouncedPromiseQueue<ValueType, OutputType> {
  resolvers: Resolvers<OutputType> = withResolvers<OutputType>()
  controller: AbortController = new AbortController()
  queuedValue: ValueType | undefined = undefined

  abort(): void {
    this.controller.abort()
    this.queuedValue = undefined
  }

  push(
    value: ValueType,
    timeMs: number,
    callback: (value: ValueType) => Promise<OutputType>
  ): Promise<OutputType> {
    this.queuedValue = value
    this.controller.abort()
    this.controller = new AbortController()
    timeout(
      () => {
        // Keep the resolvers in a separate variable to reset the queue
        // while the callback is pending, so that the next push can be
        // assigned to a new Promise (and not dropped).
        const outputResolvers = this.resolvers
        try {
          debug(13, value)
          const callbackPromise = callback(value)
          debug(14, this.queuedValue)
          this.queuedValue = undefined
          this.resolvers = withResolvers<OutputType>()
          callbackPromise
            .then(output => outputResolvers.resolve(output))
            .catch(error => outputResolvers.reject(error))
        } catch (error) {
          this.queuedValue = undefined
          outputResolvers.reject(error)
        }
      },
      timeMs,
      this.controller.signal
    )
    return this.resolvers.promise
  }
}

// --

type DebouncedUpdateQueue = DebouncedPromiseQueue<
  Omit<UpdateQueuePushArgs, 'timeMs'>,
  URLSearchParams
>

export class DebounceController {
  throttleQueue: ThrottledQueue
  queues: Map<string, DebouncedUpdateQueue> = new Map()

  constructor(throttleQueue: ThrottledQueue = new ThrottledQueue()) {
    this.throttleQueue = throttleQueue
  }

  push(
    update: Omit<UpdateQueuePushArgs, 'timeMs'>,
    timeMs: number,
    adapter: UpdateQueueAdapterContext,
    processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams
  ): Promise<URLSearchParams> {
    if (!Number.isFinite(timeMs)) {
      const getSnapshot =
        adapter.getSearchParamsSnapshot ?? getSearchParamsSnapshotFromLocation
      return Promise.resolve(getSnapshot())
    }
    const key = update.key
    let queue = this.queues.get(key)
    if (!queue) {
      debug(15, key)
      queue = new DebouncedPromiseQueue()
      this.queues.set(key, queue)
    }
    debug(17, update)
    // A restarted debounce must flush with the adapter
    // and processUrlSearchParams of its latest push.
    const flush = () => {
      this.throttleQueue.push(update)
      return this.throttleQueue
        .flush(adapter, processUrlSearchParams)
        .finally(() => {
          if (this.queues.get(key)?.queuedValue === undefined) {
            debug(16, key)
            this.queues.delete(key)
          }
          this.throttleQueue.sync.emit(key)
        })
    }
    const promise = queue.push(update, timeMs, flush)
    this.throttleQueue.sync.emit(key)
    return promise
  }

  abort(
    key: string
  ): (promise: Promise<URLSearchParams>) => Promise<URLSearchParams> {
    const queue = this.queues.get(key)
    if (!queue) {
      return passThrough => passThrough
    }
    debug(18, key, queue.queuedValue?.query)
    this.queues.delete(key)
    queue.abort() // Don't run to completion
    this.throttleQueue.sync.emit(key)
    return promise => {
      promise.then(queue.resolvers.resolve, queue.resolvers.reject)
      // Don't chain: keep reference equality
      return promise
    }
  }

  abortAll(): void {
    for (const [key, queue] of this.queues.entries()) {
      debug(18, key, queue.queuedValue?.query)
      queue.abort()
      // todo: Better abort handling
      queue.resolvers.resolve(new URLSearchParams()) // Don't leave the Promise pending
      this.throttleQueue.sync.emit(key)
    }
    this.queues.clear()
  }

  getQueuedQuery(key: string): Query | null | undefined {
    // The debounced queued values are more likely to be up-to-date
    // than any updates pending in the throttle queue, which comes last
    // in the update chain.
    const debouncedQueued = this.queues.get(key)?.queuedValue?.query
    if (debouncedQueued !== undefined) {
      return debouncedQueued
    }
    return this.throttleQueue.getQueuedQuery(key)
  }
}

export const debounceController: DebounceController = globalSingleton(
  'debounce-controller',
  () => new DebounceController(globalThrottleQueue)
)
