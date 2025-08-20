import { createEmitter, type Emitter } from './emitter'

export type CrossHookSyncPayload = {
  state: any
  query: string | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter: Emitter<EventMap> = createEmitter()
