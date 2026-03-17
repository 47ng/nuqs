import { debug } from '../debug'
import { debounceController } from './debounce'
import { globalThrottleQueue } from './throttle'

let mutex = 0

export function setQueueResetMutex(value = 1): void {
  mutex = value
}

export function spinQueueResetMutex(onReset: () => void = resetQueues): void {
  // Don't let values become too negatively large and wrap around
  mutex = Math.max(0, mutex - 1)
  if (mutex > 0) {
    return
  }
  onReset()
}

export function resetQueues(): void {
  debug('[nuqs] Aborting queues')
  debounceController.abortAll()
  const abortedKeys = globalThrottleQueue.abort()
  abortedKeys.forEach(key => debounceController.queuedQuerySync.emit(key))
}

/**
 * Abort pending flushes and clear queues without emitting on queuedQuerySync.
 *
 * This avoids triggering a SyncLane re-render of the outgoing route during
 * popstate-driven navigation, which can cause the outgoing route's
 * setState-during-render to repopulate the queue with stale values (#1358).
 * The incoming route's render-phase pathname check handles the cleanup instead.
 */
export function silentResetQueues(): void {
  debug('[nuqs] Silent reset of queues')
  // Abort all queues without emitting on queuedQuerySync to avoid
  // triggering SyncLane re-renders that could repopulate the queue (#1358).
  debounceController.abortAll(true)
  globalThrottleQueue.abort()
}
