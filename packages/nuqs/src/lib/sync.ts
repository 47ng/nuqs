import { createEmitter, type Emitter } from './emitter'
import type { Query } from './search-params'

export type CrossHookSyncPayload = {
  state: any
  query: Query | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter: Emitter<EventMap> = createEmitter()
