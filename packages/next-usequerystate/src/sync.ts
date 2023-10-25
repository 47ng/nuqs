import Mitt from 'mitt'

export const SYNC_EVENT_KEY = '__nextUseQueryState__SYNC__'
export const NOSYNC_MARKER = '__nextUseQueryState__NO_SYNC__'
const NOTIFY_EVENT_KEY = '__nextUseQueryState__NOTIFY__'

export type QueryUpdateSource = 'internal' | 'external'
export type QueryUpdateNotificationArgs = {
  search: URLSearchParams
  source: QueryUpdateSource
}

type EventMap = {
  [SYNC_EVENT_KEY]: URLSearchParams
  [NOTIFY_EVENT_KEY]: QueryUpdateNotificationArgs
  [key: string]: any
}

type Emitter = ReturnType<typeof Mitt<EventMap>>

declare global {
  interface History {
    __nextUseQueryState_emitter?: Emitter
  }
}

if (typeof history === 'object' && !history.__nextUseQueryState_emitter) {
  __DEBUG__ && console.debug('Patching history')
  const emitter = Mitt<EventMap>()
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method].bind(history)
    history[method] = function nextUseQueryState_patchedHistory(
      state: any,
      title: string,
      url?: string | URL | null
    ) {
      if (!url) {
        // Null URL is only used for state changes,
        // we're not interested in reacting to those.
        __DEBUG__ &&
          performance.mark(`[nuqs] history.${method}(null) (${title})`) &&
          console.debug(`[nuqs] history.${method}(null) (${title}) %O`, state)
        return original(state, title, url)
      }
      const source = title === NOSYNC_MARKER ? 'internal' : 'external'
      const search = new URL(url, location.origin).searchParams
      __DEBUG__ &&
        performance.mark(`[nuqs] history.${method}(${url}) (${source})`) &&
        console.debug(`[nuqs] history.${method}(${url}) (${source}) %O`, state)
      // If someone else than our hooks have updated the URL,
      // send out a signal for them to sync their internal state.
      if (source === 'external') {
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
        setTimeout(() => {
          __DEBUG__ &&
            performance.mark(
              `[nuqs] External history.${method} call: triggering sync with ${search.toString()}`
            ) &&
            console.debug(
              `[nuqs] External history.${method} call: triggering sync with ${search.toString()}`
            )
          emitter.emit(SYNC_EVENT_KEY, search)
          emitter.emit(NOTIFY_EVENT_KEY, { search, source })
        }, 0)
      } else {
        setTimeout(() => {
          emitter.emit(NOTIFY_EVENT_KEY, { search, source })
        }, 0)
      }

      return original(state, title === NOSYNC_MARKER ? '' : title, url)
    }
  }
  Object.defineProperty(history, '__nextUseQueryState_emitter', {
    value: emitter,
    writable: false,
    enumerable: false,
    configurable: false
  })
}

export const emitter: Emitter =
  typeof history === 'object'
    ? history.__nextUseQueryState_emitter ?? Mitt<EventMap>()
    : Mitt<EventMap>()

export function subscribeToQueryUpdates(
  callback: (args: QueryUpdateNotificationArgs) => void
) {
  emitter.on(NOTIFY_EVENT_KEY, callback)
  return () => emitter.off(NOTIFY_EVENT_KEY, callback)
}
