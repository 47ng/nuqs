import { debug } from '../debug'
import { globalSingleton } from '../global-singleton'
import { debounceController } from './debounce'
import { globalThrottleQueue } from './throttle'

const state = globalSingleton('queue-reset', () => ({ mutex: 0 }))

export function setQueueResetMutex(value = 1): void {
  state.mutex = value
}

export function spinQueueResetMutex(onReset: () => void = resetQueues): void {
  // Don't let values become too negatively large and wrap around
  state.mutex = Math.max(0, state.mutex - 1)
  if (state.mutex > 0) {
    return
  }
  onReset()
}

export function resetQueues(): void {
  debug(19)
  debounceController.abortAll()
  globalThrottleQueue.abort()
}
