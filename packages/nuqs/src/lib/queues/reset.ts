import { debounceController } from './debounce'
import { globalThrottleQueue } from './throttle'

export function resetQueues() {
  debounceController.abortAll()
  globalThrottleQueue.reset()
}
