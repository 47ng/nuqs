import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams
} from 'next/navigation.js' // https://github.com/47ng/nuqs/discussions/352
import React from 'react'
import { debug } from './debug'
import type { Nullable, Options } from './defs'
import type { Parser } from './parsers'
import { SYNC_EVENT_KEY, emitter, type CrossHookSyncPayload } from './sync'
import {
  FLUSH_RATE_LIMIT_MS,
  enqueueQueryStringUpdate,
  getQueuedValue,
  scheduleFlushToURL
} from './update-queue'
import { safeParse } from './utils'

type KeyMapValue<Type> = Parser<Type> &
  Options & {
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
  values: Partial<Nullable<Values<T>>> | UpdaterFn<T> | null,
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
    shallow = true,
    throttleMs = FLUSH_RATE_LIMIT_MS,
    clearOnDefault = false,
    startTransition,
    urlKeys = {}
  }: Partial<
    UseQueryStatesOptions & {
      // todo: Move into UseQueryStatesOptions in v2 (requires a breaking change
      // to make the options type generic over the key map)
      urlKeys: Partial<Record<keyof KeyMap, string>>
    }
  > = {}
): UseQueryStatesReturn<KeyMap> {
  type V = Values<KeyMap>
  const stateKeys = Object.keys(keyMap).join(',')
  const router = useRouter()
  // Not reactive, but available on the server and on page load
  const initialSearchParams = useSearchParams()
  const queryRef = React.useRef<Record<string, string | null>>({})
  const [internalState, setInternalState] = React.useState<V>(() => {
    const source = initialSearchParams ?? new URLSearchParams()
    queryRef.current = Object.fromEntries(source.entries())
    return parseMap(keyMap, urlKeys, source)
  })

  const stateRef = React.useRef(internalState)
  debug(
    '[nuq+ `%s`] render - state: %O, iSP: %s',
    stateKeys,
    internalState,
    initialSearchParams
  )

  React.useEffect(() => {
    // This will be removed in v2 which will drop support for
    // partially-functional shallow routing (14.0.2 and 14.0.3)
    if (window.next?.version !== '14.0.3') {
      return
    }
    const state = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queryRef.current,
      stateRef.current
    )
    setInternalState(state)
  }, [
    Object.keys(keyMap)
      .map(key => initialSearchParams?.get(key))
      .join('&'),
    stateKeys,
    urlKeys
  ])

  // Sync all hooks together & with external URL changes
  React.useInsertionEffect(() => {
    function updateInternalState(state: V) {
      debug('[nuq+ `%s`] updateInternalState %O', stateKeys, state)
      stateRef.current = state
      setInternalState(state)
    }
    function syncFromURL(search: URLSearchParams) {
      const state = parseMap(
        keyMap,
        urlKeys,
        search,
        queryRef.current,
        stateRef.current
      )
      debug('[nuq+ `%s`] syncFromURL %O', stateKeys, state)
      updateInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce(
      (handlers, stateKey) => {
        handlers[stateKey as keyof V] = ({
          state,
          query
        }: CrossHookSyncPayload) => {
          const { defaultValue } = keyMap[stateKey]!
          const urlKey = urlKeys[stateKey] ?? stateKey
          // Note: cannot mutate in-place, the object ref must change
          // for the subsequent setState to pick it up.
          stateRef.current = {
            ...stateRef.current,
            [stateKey as keyof V]: state ?? defaultValue ?? null
          }
          queryRef.current[urlKey] = query
          debug(
            '[nuq+ `%s`] Cross-hook key sync %s: %O (default: %O). Resolved: %O',
            stateKeys,
            urlKey,
            state,
            defaultValue,
            stateRef.current
          )
          updateInternalState(stateRef.current)
        }
        return handlers
      },
      {} as Record<keyof V, (payload: CrossHookSyncPayload) => void>
    )

    emitter.on(SYNC_EVENT_KEY, syncFromURL)
    for (const stateKey of Object.keys(keyMap)) {
      const urlKey = urlKeys[stateKey] ?? stateKey
      debug('[nuq+ `%s`] Subscribing to sync for `%s`', stateKeys, urlKey)
      emitter.on(urlKey, handlers[stateKey]!)
    }
    return () => {
      emitter.off(SYNC_EVENT_KEY, syncFromURL)
      for (const stateKey of Object.keys(keyMap)) {
        const urlKey = urlKeys[stateKey] ?? stateKey
        debug('[nuq+ `%s`] Unsubscribing to sync for `%s`', stateKeys, urlKey)
        emitter.off(urlKey, handlers[stateKey])
      }
    }
  }, [keyMap, urlKeys])

  const update = React.useCallback<SetValues<KeyMap>>(
    (stateUpdater, callOptions = {}) => {
      const newState: Partial<Nullable<KeyMap>> =
        typeof stateUpdater === 'function'
          ? stateUpdater(stateRef.current)
          : stateUpdater === null
            ? (Object.fromEntries(
                Object.keys(keyMap).map(key => [key, null])
              ) as Nullable<KeyMap>)
            : stateUpdater
      debug('[nuq+ `%s`] setState: %O', stateKeys, newState)
      for (let [stateKey, value] of Object.entries(newState)) {
        const parser = keyMap[stateKey]
        const urlKey = urlKeys[stateKey] ?? stateKey
        if (!parser) {
          continue
        }
        if (
          (callOptions.clearOnDefault ??
            parser.clearOnDefault ??
            clearOnDefault) &&
          value !== null &&
          parser.defaultValue !== undefined &&
          (parser.eq ?? ((a, b) => a === b))(value, parser.defaultValue)
        ) {
          value = null
        }

        queryRef.current[urlKey] = enqueueQueryStringUpdate(
          urlKey,
          value,
          parser.serialize ?? String,
          {
            // Call-level options take precedence over individual parser options
            // which take precedence over global options
            history: callOptions.history ?? parser.history ?? history,
            shallow: callOptions.shallow ?? parser.shallow ?? shallow,
            scroll: callOptions.scroll ?? parser.scroll ?? scroll,
            throttleMs:
              callOptions.throttleMs ?? parser.throttleMs ?? throttleMs,
            startTransition:
              callOptions.startTransition ??
              parser.startTransition ??
              startTransition
          }
        )
        emitter.emit(urlKey, {
          state: value,
          query: queryRef.current[urlKey] ?? null
        })
      }
      return scheduleFlushToURL(router)
    },
    [keyMap, history, shallow, scroll, throttleMs, startTransition]
  )
  return [internalState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  urlKeys: Partial<Record<keyof KeyMap, string>>,
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  cachedQuery?: Record<string, string | null>,
  cachedState?: Values<KeyMap>
) {
  return Object.keys(keyMap).reduce((obj, stateKey) => {
    const urlKey = urlKeys?.[stateKey] ?? stateKey
    const { defaultValue, parse } = keyMap[stateKey]!
    const urlQuery = searchParams?.get(urlKey) ?? null
    const queueQuery = getQueuedValue(urlKey)
    const query = queueQuery ?? urlQuery
    if (cachedQuery && cachedState && cachedQuery[urlKey] === query) {
      obj[stateKey as keyof KeyMap] =
        cachedState[stateKey] ?? defaultValue ?? null
      return obj
    }
    const value = query === null ? null : safeParse(parse, query, stateKey)
    obj[stateKey as keyof KeyMap] = value ?? defaultValue ?? null
    if (cachedQuery) {
      cachedQuery[urlKey] = query
    }
    return obj
  }, {} as Values<KeyMap>)
}
