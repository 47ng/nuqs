import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams
} from 'next/navigation.js' // https://github.com/47ng/next-usequerystate/discussions/352
import React from 'react'
import type { Nullable, Options } from './defs'
import type { Parser } from './parsers'
import { SYNC_EVENT_KEY, emitter } from './sync'
import { enqueueQueryStringUpdate, flushToURL } from './update-queue'

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

  // Sync all hooks together & with external URL changes
  React.useEffect(() => {
    function syncFromURL(search: URLSearchParams) {
      const state = parseMap(keyMap, search)
      setInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce((handlers, key) => {
      handlers[key as keyof V] = (value: any) => {
        const { defaultValue } = keyMap[key]
        setInternalState(state => ({
          ...state,
          [key]: value ?? defaultValue ?? null
        }))
      }
      return handlers
    }, {} as Record<keyof V, any>)

    for (const key of Object.keys(keyMap)) {
      emitter.on(key, handlers[key])
    }
    emitter.on(SYNC_EVENT_KEY, syncFromURL)
    return () => {
      for (const key of Object.keys(keyMap)) {
        emitter.off(key, handlers[key])
      }
      emitter.off(SYNC_EVENT_KEY, syncFromURL)
    }
  }, [keyMap])

  const update = React.useCallback<SetValues<KeyMap>>(
    (stateUpdater, options = {}) => {
      const isUpdaterFunction = (input: any): input is UpdaterFn<KeyMap> => {
        return typeof input === 'function'
      }

      // Resolve the new values based on old values & updater
      const search = new URLSearchParams(window.location.search)
      let newState: Partial<Nullable<KeyMap>> = {}
      if (isUpdaterFunction(stateUpdater)) {
        // todo: Should oldState contain null/undefined queries if not set?
        const oldState = parseMap(keyMap, search)
        newState = stateUpdater(oldState)
      } else {
        newState = stateUpdater
      }
      for (const [key, value] of Object.entries(newState)) {
        const { serialize } = keyMap[key]
        emitter.emit(key, value)
        enqueueQueryStringUpdate(key, value, serialize ?? String, {
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
    const { defaultValue, parse } = keyMap[key]
    const query = searchParams?.get(key) ?? null
    const value = query === null ? null : parse(query)
    obj[key as keyof KeyMap] = value ?? defaultValue ?? null
    return obj
  }, {} as Values<KeyMap>)
}
