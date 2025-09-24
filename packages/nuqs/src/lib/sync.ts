import { createEmitter, type Emitter } from './emitter'
import type { QueryParam } from './search-params'

export type CrossHookSyncPayload = {
  state: any
  query: QueryParam | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter: Emitter<EventMap> = createEmitter()
