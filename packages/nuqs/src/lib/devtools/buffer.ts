import type { NuqsLogEvent } from './events'

export const MAX_EVENTS = 500

// Anchored on globalThis (like the event client) so the sink and the panel share
// one buffer even if the module is instantiated more than once. Survives the
// panel unmounting on a devtools tab switch; the panel reads it on (re)mount to
// backfill, then appends live via the bus.
const store = ((
  globalThis as { __nuqs_devtools_buffer__?: { events: NuqsLogEvent[] } }
).__nuqs_devtools_buffer__ ??= { events: [] })

export function pushEvent(event: NuqsLogEvent): void {
  store.events.push(event)
  if (store.events.length > MAX_EVENTS) {
    store.events.splice(0, store.events.length - MAX_EVENTS)
  }
}

export function getEvents(): readonly NuqsLogEvent[] {
  return store.events
}

export function clearEvents(): void {
  store.events = []
}
