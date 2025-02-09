import { timeout } from '../timeout'
import { withResolvers } from '../with-resolvers'
import {
  globalThrottleQueue,
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

  public push(value: ValueType, timeMs: number) {
    this.queuedValue = value
    this.controller.abort()
    this.controller = new AbortController()
    timeout(
      () => {
        try {
          this.callback(value)
            .then(output => this.resolvers.resolve(output))
            .catch(error => this.resolvers.reject(error))
            .finally(() => {
              // todo: Should we clear the queued value here?
              this.resolvers = withResolvers<OutputType>()
            })
        } catch (error) {
          this.resolvers.reject(error)
        }
      },
      timeMs,
      this.controller.signal
    )
    return this.resolvers.promise
  }

  public get queued() {
    return this.queuedValue
  }
}

type DebouncedUpdateQueue = DebouncedPromiseQueue<
  Omit<UpdateQueuePushArgs, 'throttleMs'>,
  URLSearchParams
>

export class DebounceController {
  queues: Map<string, DebouncedUpdateQueue> = new Map()

  public push(
    update: Omit<UpdateQueuePushArgs, 'throttleMs'>,
    timeMs: number,
    adapter: UpdateQueueAdapterContext
  ): Promise<URLSearchParams> {
    if (!this.queues.has(update.key)) {
      const queue = new DebouncedPromiseQueue<
        Omit<UpdateQueuePushArgs, 'throttleMs'>,
        URLSearchParams
      >(update => {
        globalThrottleQueue.push(update)
        return globalThrottleQueue.flush(adapter)
        // todo: Figure out cleanup strategy
        // .finally(() => {
        //   this.queues.delete(update.key)
        // })
      })
      this.queues.set(update.key, queue)
    }
    const queue = this.queues.get(update.key)!
    return queue.push(update, timeMs)
  }

  public getQueuedQuery(key: string) {
    // The debounced queued values are more likely to be up-to-date
    // than any updates pending in the throttle queue, which comes last
    // in the update chain.
    const debouncedQueued = this.queues.get(key)?.queued?.query
    if (debouncedQueued !== undefined) {
      return debouncedQueued
    }
    return globalThrottleQueue.getQueuedQuery(key)
  }
}

export const debounceController = new DebounceController()
