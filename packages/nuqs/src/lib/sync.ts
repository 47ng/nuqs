import { createEmitter, type Emitter } from './emitter'
import { globalSingleton } from './global-singleton'
import type { Query } from './search-params'

export type CrossHookSyncPayload = {
  state: any
  query: Query | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter: Emitter<EventMap> = globalSingleton('sync-emitter', () =>
  createEmitter<EventMap>()
)
