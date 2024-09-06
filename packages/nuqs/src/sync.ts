import Mitt from 'mitt'

export const SYNC_EVENT_KEY = Symbol('__nuqs__SYNC__')
const NOTIFY_EVENT_KEY = Symbol('__nuqs__NOTIFY__')

export type QueryUpdateSource = 'internal' | 'external'
export type QueryUpdateNotificationArgs = {
  search: URLSearchParams
  source: QueryUpdateSource
}
export type CrossHookSyncPayload = {
  state: any
  query: string | null
}

type EventMap = {
  [SYNC_EVENT_KEY]: URLSearchParams
  [NOTIFY_EVENT_KEY]: QueryUpdateNotificationArgs
  [key: string]: CrossHookSyncPayload
}

export const emitter = Mitt<EventMap>()
