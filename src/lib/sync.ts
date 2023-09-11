import Mitt from 'mitt'
import React from 'react'

export const SYNC_EVENT_KEY = Symbol('__nextUseQueryState__SYNC__')
export const NOSYNC_MARKER = '__nextUseQueryState__NO_SYNC__'
export const NOTIFY_EVENT_KEY = Symbol('__nextUseQueryState__NOTIFY__')

type EventMap = {
  [SYNC_EVENT_KEY]: URLSearchParams
  [NOTIFY_EVENT_KEY]: URLSearchParams
  [key: string]: any
}

export const emitter = Mitt<EventMap>()

export function subscribeToQueryUpdates(
  callback: (search: URLSearchParams) => void
) {
  emitter.on(NOTIFY_EVENT_KEY, callback)
  return () => emitter.off(NOTIFY_EVENT_KEY, callback)
}

let patched = false

export function usePatchedHistory() {
  React.useEffect(() => {
    if (patched) {
      return
    }
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = window.history[method].bind(window.history)
      window.history[method] = function nextUseQueryState_patchedHistory(
        state: any,
        marker: string,
        url?: string | URL | null
      ) {
        // If someone else than our hooks have updated the URL,
        // send out a signal for them to sync their internal state.
        if (marker !== NOSYNC_MARKER && url) {
          const search = new URL(url, location.origin).searchParams
          // Here we're delaying application to next tick to avoid:
          // `Warning: useInsertionEffect must not schedule updates.`
          //
          // Because the emitter runs in sync, this would trigger
          // each hook's setInternalState updates, so we schedule
          // those after the current batch of events.
          // Because we don't know if the history method would
          // have been applied by then, we're also sending the
          // parsed query string to the hooks so they don't need
          // to rely on the URL being up to date.
          setTimeout(() => emitter.emit(SYNC_EVENT_KEY, search), 0)
        }
        return original(state, '', url)
      }
    }
    patched = true
  }, [])
}
