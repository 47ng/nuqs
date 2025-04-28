import mitt, { type Emitter } from 'mitt'

export type CrossHookSyncPayload = {
  state: any
  query: string | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter: Emitter<EventMap> = mitt()
