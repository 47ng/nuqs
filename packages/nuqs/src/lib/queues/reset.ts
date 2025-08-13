import { debug } from '../debug'
import { debounceController } from './debounce'
import { globalThrottleQueue } from './throttle'

let mutex = 0

export function setQueueResetMutex(value = 1): void {
  mutex = value
}

export function spinQueueResetMutex(): void {
  // Don't let values become too negatively large and wrap around
  mutex = Math.max(0, mutex - 1)
  if (mutex > 0) {
    return
  }
  resetQueues()
}

export function resetQueues(): void {
  debug('[nuqs] Aborting queues')
  debounceController.abortAll()
  const abortedKeys = globalThrottleQueue.abort()
  abortedKeys.forEach(key => debounceController.queuedQuerySync.emit(key))
}
