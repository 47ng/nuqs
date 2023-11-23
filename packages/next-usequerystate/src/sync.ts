import Mitt from 'mitt'
import { debug } from './debug'
import { error } from './errors'
import { getQueuedValue } from './update-queue'

export const SYNC_EVENT_KEY = Symbol('__nextUseQueryState__SYNC__')
export const NOSYNC_MARKER = '__nextUseQueryState__NO_SYNC__'
const NOTIFY_EVENT_KEY = Symbol('__nextUseQueryState__NOTIFY__')

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

export const emitter = Mitt<EventMap>()

declare global {
  interface History {
    __nextUseQueryState_patched?: string
  }
}

export function subscribeToQueryUpdates(
  callback: (args: QueryUpdateNotificationArgs) => void
) {
  emitter.on(NOTIFY_EVENT_KEY, callback)
  return () => emitter.off(NOTIFY_EVENT_KEY, callback)
}

if (typeof history === 'object') {
  patchHistory()
}

function patchHistory() {
  // This is replaced with the package.json version by scripts/prepack.sh
  // after semantic-release has done updating the version number.
  const version = '0.0.0-inject-version-here'
  const patched = history.__nextUseQueryState_patched
  if (patched) {
    if (patched !== version) {
      console.error(error(409), patched, version)
    }
    return
  }
  debug('[nuqs] Patching history with %s', version)
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
        debug('[nuqs] history.%s(null) (%s) %O', method, title, state)
        return original(state, title, url)
      }
      const source = title === NOSYNC_MARKER ? 'internal' : 'external'
      const search = new URL(url, location.origin).searchParams
      debug(`[nuqs] history.%s(%s) (%s) %O`, method, url, source, state)
      // If someone else than our hooks have updated the URL,
      // send out a signal for them to sync their internal state.
      if (source === 'external') {
        for (const [key, value] of search.entries()) {
          const queueValue = getQueuedValue(key)
          if (queueValue !== null && queueValue !== value) {
            debug(
              '[nuqs] Overwrite detected for key: %s, Server: %s, queue: %s',
              key,
              value,
              queueValue
            )
            search.set(key, queueValue)
          }
        }
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
          debug(
            '[nuqs] External history.%s call: triggering sync with %s',
            method,
            search
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
  Object.defineProperty(history, '__nextUseQueryState_patched', {
    value: version,
    writable: false,
    enumerable: false,
    configurable: false
  })
}
