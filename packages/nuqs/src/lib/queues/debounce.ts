import { debug } from '../debug'
import { timeout } from '../timeout'
import { withResolvers } from '../with-resolvers'
import {
  globalThrottleQueue,
  ThrottledQueue,
  type UpdateQueueAdapterContext,
  type UpdateQueuePushArgs
} from './throttle'

export class DebouncedPromiseQueue<ValueType, OutputType> {
  callback: (value: ValueType) => Promise<OutputType>
  resolvers = withResolvers<OutputType>()
  controller = new AbortController()
  queuedValue: ValueType | undefined = undefined

  constructor(callback: (value: ValueType) => Promise<OutputType>) {
    this.callback = callback
  }

  push(value: ValueType, timeMs: number) {
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
          debug('[nuqs queue] Flushing debounce queue', value)
          const callbackPromise = this.callback(value)
          debug('[nuqs queue] Reset debounced queue %O', this.queuedValue)
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
    adapter: UpdateQueueAdapterContext
  ): Promise<URLSearchParams> {
    if (!this.queues.has(update.key)) {
      const queue = new DebouncedPromiseQueue<
        Omit<UpdateQueuePushArgs, 'timeMs'>,
        URLSearchParams
      >(update => {
        this.throttleQueue.push(update)
        return this.throttleQueue.flush(adapter).finally(() => {
          const queuedValue = this.queues.get(update.key)?.queuedValue
          if (queuedValue === undefined) {
            // Cleanup empty queues
            this.queues.delete(update.key)
          }
        })
      })
      this.queues.set(update.key, queue)
    }
    const queue = this.queues.get(update.key)!
    return queue.push(update, timeMs)
  }

  getQueuedQuery(key: string) {
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

export const debounceController = new DebounceController(globalThrottleQueue)
