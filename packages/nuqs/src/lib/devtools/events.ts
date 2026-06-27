import { EventClient } from '@tanstack/devtools-event-client'
import type { DebugArgs, DebugCode } from '../debug-messages'
import type { LogCategory } from './category'

type LogLevel = 'log' | 'warn'

/**
 * A single normalized debug event sent over the TanStack bus.
 *
 * Discriminated by `code` so the panel narrows to the exact per-code argument
 * tuple (`DebugArgs<Code>`), recovering the same type precision the catalog
 * gives the `debug()` call sites. `args` carry the sink-normalized values
 * (cloned for immutability, functions replaced with a marker), and `message`
 * is the ready-to-render formatted line.
 */
export type NuqsLogEvent = {
  [Code in DebugCode]: {
    id: number
    ts: number
    level: LogLevel
    code: Code
    category: LogCategory
    message: string
    args: DebugArgs<Code>
  }
}[DebugCode]

type NuqsDevtoolsEventMap = {
  log: NuqsLogEvent
}

class NuqsEventClient extends EventClient<NuqsDevtoolsEventMap> {
  constructor() {
    super({ pluginId: 'nuqs' })
  }
}

// Anchor singletons on globalThis: bundlers (e.g. Next with a `'use client'`
// entry) can instantiate this module more than once, which would split the sink
// (emits) from the panel (subscribes) across separate clients and buffers. A
// global store keeps them on a single instance.
type DevtoolsGlobal = {
  client?: NuqsEventClient
  seq: number
}
const store: DevtoolsGlobal = ((
  globalThis as { __nuqs_devtools__?: DevtoolsGlobal }
).__nuqs_devtools__ ??= { seq: 0 })

/**
 * Singleton bus shared by the sink (emits) and the panel (subscribes).
 * The `nuqs` pluginId namespaces events as `nuqs:log` on the TanStack bus.
 */
export const eventClient: NuqsEventClient = (store.client ??=
  new NuqsEventClient())

/** Monotonic id for stable list keys and buffer/bus dedup. */
export function nextEventId(): number {
  return store.seq++
}
