import { debounceController } from './debounce'
import { globalThrottleQueue } from './throttle'

export function resetQueues() {
  debounceController.abortAll()
  const abortedKeys = globalThrottleQueue.abort()
  abortedKeys.forEach(key => debounceController.queuedQuerySync.emit(key))
}
