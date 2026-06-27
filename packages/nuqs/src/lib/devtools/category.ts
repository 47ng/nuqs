import type { DebugCode } from '../debug-messages'

export type LogCategory =
  | 'state'
  | 'throttle'
  | 'debounce'
  | 'queue'
  | 'adapter'
  | 'parse'

/**
 * Map a debug code to a coarse category, mirroring the comment groups in the
 * catalog. Drives at-a-glance grouping in the panel (and, later, filtering).
 */
export function categoryForCode(code: DebugCode): LogCategory {
  if (code <= 6) return 'state' // useQueryStates
  if (code <= 12) return 'throttle' // global throttle queue (gtq)
  if (code <= 18) return 'debounce' // debounce queue (dq / dqc)
  if (code === 19) return 'queue' // aborting queues
  if (code <= 23) return 'adapter' // adapters & key isolation
  return 'parse' // safe-parse (24, 25)
}
