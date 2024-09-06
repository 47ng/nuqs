import Mitt from 'mitt'

export const SYNC_EVENT_KEY = Symbol('__nuqs__SYNC__')

export type CrossHookSyncPayload = {
  state: any
  query: string | null
}

type EventMap = {
  [SYNC_EVENT_KEY]: URLSearchParams
  [key: string]: CrossHookSyncPayload
}

export const emitter = Mitt<EventMap>()
