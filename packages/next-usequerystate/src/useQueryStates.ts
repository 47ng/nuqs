import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams
} from 'next/navigation.js' // https://github.com/47ng/next-usequerystate/discussions/352
import React from 'react'
import { debug } from './debug'
import type { Nullable, Options } from './defs'
import type { Parser } from './parsers'
import { SYNC_EVENT_KEY, emitter } from './sync'
import {
  enqueueQueryStringUpdate,
  flushToURL,
  getInitialStateFromQueue
} from './update-queue'

type KeyMapValue<Type> = Parser<Type> & {
  defaultValue?: Type
}

export type UseQueryStatesKeysMap<Map = any> = {
  [Key in keyof Map]: KeyMapValue<Map[Key]>
}

export interface UseQueryStatesOptions extends Options {}

export type Values<T extends UseQueryStatesKeysMap> = {
  [K in keyof T]: T[K]['defaultValue'] extends NonNullable<
    ReturnType<T[K]['parse']>
  >
    ? NonNullable<ReturnType<T[K]['parse']>>
    : ReturnType<T[K]['parse']> | null
}

type UpdaterFn<T extends UseQueryStatesKeysMap> = (
  old: Values<T>
) => Partial<Nullable<Values<T>>>

export type SetValues<T extends UseQueryStatesKeysMap> = (
  values: Partial<Nullable<Values<T>>> | UpdaterFn<T>,
  options?: Options
) => Promise<URLSearchParams>

export type UseQueryStatesReturn<T extends UseQueryStatesKeysMap> = [
  Values<T>,
  SetValues<T>
]

/**
 * Synchronise multiple query string arguments to React state in Next.js
 *
 * @param keys - An object describing the keys to synchronise and how to
 *               serialise and parse them.
 *               Use `queryTypes.(string|integer|float)` for quick shorthands.
 * @param options - Optional history mode, shallow routing and scroll restoration options.
 */
export function useQueryStates<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  {
    history = 'replace',
    scroll = false,
    shallow = true
  }: Partial<UseQueryStatesOptions> = {}
): UseQueryStatesReturn<KeyMap> {
  type V = Values<KeyMap>
  const keys = Object.keys(keyMap).join(',')
  const router = useRouter()
  // Not reactive, but available on the server and on page load
  const initialSearchParams = useSearchParams()
  const [internalState, setInternalState] = React.useState<V>(() => {
    if (typeof window !== 'object') {
      // SSR
      return parseMap(keyMap, initialSearchParams ?? new URLSearchParams())
    }
    // Components mounted after page load must use the current URL value
    return parseMap(keyMap, new URLSearchParams(window.location.search))
  })
  const stateRef = React.useRef(internalState)
  debug(
    '[nuq+ `%s`] render - state: %O, iSP: %s',
    keys,
    internalState,
    initialSearchParams
  )

  // Sync all hooks together & with external URL changes
  React.useInsertionEffect(() => {
    function updateInternalState(state: V) {
      debug('[nuq+ `%s`] updateInternalState %O', keys, state)
      stateRef.current = state
      setInternalState(state)
    }
    function syncFromURL(search: URLSearchParams) {
      const state = parseMap(keyMap, search)
      debug('[nuq+ `%s`] syncFromURL %O', keys, state)
      updateInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce((handlers, key) => {
      handlers[key as keyof V] = (value: any) => {
        const { defaultValue } = keyMap[key]!
        // Note: cannot mutate in-place, the object ref must change
        // for the subsequent setState to pick it up.
        stateRef.current = {
          ...stateRef.current,
          [key as keyof V]: value ?? defaultValue ?? null
        }
        debug(
          '[nuq+ `%s`] Cross-hook key sync %s: %O (default: %O). Resolved: %O',
          keys,
          key,
          value,
          defaultValue,
          stateRef.current
        )
        // __DEBUG__ &&
        //   performance.mark(
        //     `[nuq+ \`${Object.keys(keyMap).join(
        //       ','
        //     )}\`] Cross-hook key sync \`${key}\`: ${value} (default: ${defaultValue}). Resolved state: ${JSON.stringify(
        //       stateRef.current
        //     )}`
        //   ) &&
        //   console.debug(
        //     `[nuq+ \`${Object.keys(keyMap).join(
        //       ','
        //     )}\`] Cross-hook key sync \`${key}\`: %O (default: %O). Resolved state: %O`,
        //     value,
        //     defaultValue,
        //     stateRef.current
        //   )
        updateInternalState(stateRef.current)
      }
      return handlers
    }, {} as Record<keyof V, any>)

    emitter.on(SYNC_EVENT_KEY, syncFromURL)
    for (const key of Object.keys(keyMap)) {
      debug('[nuq+ `%s`] Subscribing to sync for `%s`', keys, key)
      // __DEBUG__ &&
      //   performance.mark(
      //     `[nuq+ \`${Object.keys(keyMap).join(
      //       ','
      //     )}\`] Subscribing to sync for \`${key}\``
      //   ) &&
      //   console.debug(
      //     `[nuq+ \`${Object.keys(keyMap).join(
      //       ','
      //     )}\`] Subscribing to sync for \`${key}\``
      //   )
      emitter.on(key, handlers[key])
    }
    return () => {
      emitter.off(SYNC_EVENT_KEY, syncFromURL)
      for (const key of Object.keys(keyMap)) {
        debug('[nuq+ `%s`] Unsubscribing to sync for `%s`', keys, key)
        // __DEBUG__ &&
        //   performance.mark(
        //     `[nuq+ \`${Object.keys(keyMap).join(
        //       ','
        //     )}\`] Unsubscribing to sync for \`${key}\``
        //   ) &&
        //   console.debug(
        //     `[nuq+ \`${Object.keys(keyMap).join(
        //       ','
        //     )}\`] Unsubscribing to sync for \`${key}\``
        //   )
        emitter.off(key, handlers[key])
      }
    }
  }, [keyMap])

  const update = React.useCallback<SetValues<KeyMap>>(
    (stateUpdater, options = {}) => {
      const newState: Partial<Nullable<KeyMap>> =
        typeof stateUpdater === 'function'
          ? stateUpdater(stateRef.current)
          : stateUpdater
      debug('[nuq+ `%s`] setState: %O', keys, newState)
      // __DEBUG__ &&
      //   performance.mark(
      //     `[nuq+ \`${Object.keys(keyMap).join(
      //       ','
      //     )}\`] setState: ${JSON.stringify(newState)}`
      //   ) &&
      //   console.debug(
      //     `[nuq+ \`${Object.keys(keyMap).join(',')}\`] setState: %O`,
      //     newState
      //   )
      for (const [key, value] of Object.entries(newState)) {
        const config = keyMap[key]
        if (!config) {
          continue
        }
        emitter.emit(key, value)
        enqueueQueryStringUpdate(key, value, config.serialize ?? String, {
          // Call-level options take precedence over hook declaration options.
          history: options.history ?? history,
          shallow: options.shallow ?? shallow,
          scroll: options.scroll ?? scroll
        })
      }
      return flushToURL(router)
    },
    [keyMap, history, shallow, scroll]
  )
  return [internalState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  searchParams: URLSearchParams | ReadonlyURLSearchParams
) {
  return Object.keys(keyMap).reduce((obj, key) => {
    const { defaultValue, parse } = keyMap[key]!
    const urlQuery = searchParams?.get(key) ?? null
    const queueQuery = getInitialStateFromQueue(key)
    const query = queueQuery ?? urlQuery
    const value = query === null ? null : parse(query)
    obj[key as keyof KeyMap] = value ?? defaultValue ?? null
    return obj
  }, {} as Values<KeyMap>)
}
