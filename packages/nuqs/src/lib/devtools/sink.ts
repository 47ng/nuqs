import { addDebugSink } from '../debug'
import { debugMessages, sprintf, type DebugCode } from '../debug-messages'
import { pushEvent } from './buffer'
import { categoryForCode } from './category'
import { eventClient, nextEventId, type NuqsLogEvent } from './events'
import { normalize } from './normalize'

function formatMessage(code: DebugCode, args: unknown[]): string {
  // sprintf's %O runs JSON.stringify, which throws on cycles or BigInt. Logging
  // must never throw into the app's update path, so fall back to the raw
  // template (the structured args stay available in the panel's inspector).
  try {
    return sprintf(debugMessages[code], ...args)
  } catch {
    return debugMessages[code]
  }
}

/**
 * Register the devtools sink: on each debug call, snapshot the args (immutable +
 * serializable), build the log event, store it for backfill, and emit it on the
 * bus. All normalization happens here, so a debug call costs nothing when no
 * sink is attached. Returns a remover (unused today, the sink lives for the
 * page lifetime, but kept symmetric with `addDebugSink`).
 */
export function installNuqsDevtoolsSink(): () => void {
  return addDebugSink((code, args, isWarn) => {
    const normalizedArgs = args.map(normalize)
    const event = {
      id: nextEventId(),
      ts: Date.now(),
      level: isWarn ? 'warn' : 'log',
      code,
      category: categoryForCode(code),
      message: formatMessage(code, normalizedArgs),
      args: normalizedArgs
    } as NuqsLogEvent
    pushEvent(event)
    eventClient.emit('log', event)
  })
}
