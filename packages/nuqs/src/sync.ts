import Mitt from 'mitt'

export type CrossHookSyncPayload = {
  state: any
  query: string | null
}

type EventMap = {
  [key: string]: CrossHookSyncPayload
}

export const emitter = Mitt<EventMap>()
