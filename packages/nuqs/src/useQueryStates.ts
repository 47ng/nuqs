import {
  useCallback,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useAdapter } from './adapters/internal.context'
import { debug } from './debug'
import type { Nullable, Options } from './defs'
import type { Parser } from './parsers'
import { emitter, type CrossHookSyncPayload } from './sync'
import {
  FLUSH_RATE_LIMIT_MS,
  enqueueQueryStringUpdate,
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

export type UseQueryStatesOptions<KeyMap extends UseQueryStatesKeysMap> =
  Options & {
    urlKeys: Partial<Record<keyof KeyMap, string>>
  }

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

// Ensure referential consistency for the default value of urlKeys
// by hoisting it out of the function scope.
// Otherwise useEffect loops go brrrr
const defaultUrlKeys = {}

/**
 * Synchronise multiple query string arguments to React state in Next.js
 *
 * @param keys - An object describing the keys to synchronise and how to
 *               serialise and parse them.
 *               Use `parseAs(String|Integer|Float|...)` for quick shorthands.
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
    urlKeys = defaultUrlKeys
  }: Partial<UseQueryStatesOptions<KeyMap>> = {}
): UseQueryStatesReturn<KeyMap> {
  type V = Values<KeyMap>
  const stateKeys = Object.keys(keyMap).join(',')
  const resolvedUrlKeys = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(keyMap).map(key => [key, urlKeys[key] ?? key])
      ),
    [stateKeys, urlKeys]
  )
  const {
    searchParams: initialSearchParams,
    updateUrl,
    rateLimitFactor = 1
  } = useAdapter()
  const queryRef = useRef<Record<string, string | null>>({})
  // Initialise the queryRef with the initial values
  if (Object.keys(queryRef.current).length !== Object.keys(keyMap).length) {
    queryRef.current = Object.fromEntries(initialSearchParams?.entries() ?? [])
  }

  const [internalState, setInternalState] = useState<V>(() => {
    const source = initialSearchParams ?? new URLSearchParams()
    return parseMap(keyMap, urlKeys, source)
  })

  const stateRef = useRef(internalState)
  debug(
    '[nuq+ `%s`] render - state: %O, iSP: %s',
    stateKeys,
    internalState,
    initialSearchParams
  )

  useEffect(() => {
    const state = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queryRef.current,
      stateRef.current
    )
    setInternalState(state)
  }, [
    Object.keys(resolvedUrlKeys)
      .map(key => initialSearchParams?.get(key))
      .join('&')
  ])

  // Sync all hooks together & with external URL changes
  useInsertionEffect(() => {
    function updateInternalState(state: V) {
      debug('[nuq+ `%s`] updateInternalState %O', stateKeys, state)
      stateRef.current = state
      setInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce(
      (handlers, stateKey) => {
        handlers[stateKey as keyof V] = ({
          state,
          query
        }: CrossHookSyncPayload) => {
          const { defaultValue } = keyMap[stateKey]!
          const urlKey = resolvedUrlKeys[stateKey]!
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

    for (const stateKey of Object.keys(keyMap)) {
      const urlKey = resolvedUrlKeys[stateKey]!
      debug('[nuq+ `%s`] Subscribing to sync for `%s`', stateKeys, urlKey)
      emitter.on(urlKey, handlers[stateKey]!)
    }
    return () => {
      for (const stateKey of Object.keys(keyMap)) {
        const urlKey = resolvedUrlKeys[stateKey]!
        debug('[nuq+ `%s`] Unsubscribing to sync for `%s`', stateKeys, urlKey)
        emitter.off(urlKey, handlers[stateKey])
      }
    }
  }, [keyMap, resolvedUrlKeys])

  const update = useCallback<SetValues<KeyMap>>(
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
        const urlKey = resolvedUrlKeys[stateKey]!
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
      return scheduleFlushToURL(updateUrl, rateLimitFactor)
    },
    [
      keyMap,
      history,
      shallow,
      scroll,
      throttleMs,
      startTransition,
      resolvedUrlKeys,
      updateUrl,
      rateLimitFactor
    ]
  )
  return [internalState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  urlKeys: Partial<Record<keyof KeyMap, string>>,
  searchParams: URLSearchParams,
  cachedQuery?: Record<string, string | null>,
  cachedState?: Values<KeyMap>
) {
  return Object.keys(keyMap).reduce((obj, stateKey) => {
    const urlKey = urlKeys?.[stateKey] ?? stateKey
    const { defaultValue, parse } = keyMap[stateKey]!
    const query = searchParams?.get(urlKey) ?? null
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
