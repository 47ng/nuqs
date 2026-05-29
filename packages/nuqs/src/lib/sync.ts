import { createEmitter, type Emitter } from './emitter'
import type { Query } from './search-params'

export type CrossHookSyncPayload = {
  state: any
  query: Query | null
}

export const emitter: Emitter<Record<string, CrossHookSyncPayload>> =
  createEmitter()
