import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAdapter } from './adapters/lib/context'
import { debug } from './debug'
import type { Nullable, Options, UrlKeys } from './defs'
import type { Parser } from './parsers'
import { emitter, type CrossHookSyncPayload } from './sync'
import {
  enqueueQueryStringUpdate,
  FLUSH_RATE_LIMIT_MS,
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

export type UseQueryStatesOptions<KeyMap extends UseQueryStatesKeysMap> =
  Options & {
    urlKeys: UrlKeys<KeyMap>
  }

export type Values<T extends UseQueryStatesKeysMap> = {
  [K in keyof T]: T[K]['defaultValue'] extends NonNullable<
    ReturnType<T[K]['parse']>
  >
    ? NonNullable<ReturnType<T[K]['parse']>>
    : ReturnType<T[K]['parse']> | null
}
type NullableValues<T extends UseQueryStatesKeysMap> = Nullable<Values<T>>

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
    clearOnDefault = true,
    startTransition,
    urlKeys = defaultUrlKeys
  }: Partial<UseQueryStatesOptions<KeyMap>> = {}
): UseQueryStatesReturn<KeyMap> {
  type V = NullableValues<KeyMap>
  const stateKeys = Object.keys(keyMap).join(',')
  const resolvedUrlKeys = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(keyMap).map(key => [key, urlKeys[key] ?? key])
      ),
    [stateKeys, urlKeys]
  )
  const adapter = useAdapter()
  const initialSearchParams = adapter.searchParams
  const queryRef = useRef<Record<string, string | null>>({})
  // Initialise the queryRef with the initial values
  if (Object.keys(queryRef.current).length !== Object.keys(keyMap).length) {
    queryRef.current = Object.fromEntries(
      Object.values(resolvedUrlKeys).map(urlKey => [
        urlKey,
        initialSearchParams?.get(urlKey) ?? null
      ])
    )
  }
  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(keyMap).map(key => [key, keyMap[key]!.defaultValue ?? null])
      ) as Values<KeyMap>,
    [
      Object.values(keyMap)
        .map(({ defaultValue }) => defaultValue)
        .join(',')
    ]
  )

  const [internalState, setInternalState] = useState<V>(() => {
    const source = initialSearchParams ?? new URLSearchParams()
    return parseMap(keyMap, urlKeys, source).state
  })

  const stateRef = useRef(internalState)
  debug(
    '[nuq+ `%s`] render - state: %O, iSP: %s',
    stateKeys,
    internalState,
    initialSearchParams
  )

  useEffect(() => {
    const { state, hasChanged } = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queryRef.current,
      stateRef.current
    )
    if (hasChanged) {
      stateRef.current = state
      setInternalState(state)
    }
  }, [
    Object.values(resolvedUrlKeys)
      .map(key => `${key}=${initialSearchParams?.get(key)}`)
      .join('&')
  ])

  // Sync all hooks together & with external URL changes
  useEffect(() => {
    function updateInternalState(state: V) {
      debug('[nuq+ `%s`] updateInternalState %O', stateKeys, state)
      stateRef.current = state
      setInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce(
      (handlers, stateKey) => {
        handlers[stateKey as keyof KeyMap] = ({
          state,
          query
        }: CrossHookSyncPayload) => {
          const { defaultValue } = keyMap[stateKey]!
          const urlKey = resolvedUrlKeys[stateKey]!
          // Note: cannot mutate in-place, the object ref must change
          // for the subsequent setState to pick it up.
          stateRef.current = {
            ...stateRef.current,
            [stateKey as keyof KeyMap]: state ?? defaultValue ?? null
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
      {} as Record<keyof KeyMap, (payload: CrossHookSyncPayload) => void>
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
  }, [stateKeys, resolvedUrlKeys])

  const update = useCallback<SetValues<KeyMap>>(
    (stateUpdater, callOptions = {}) => {
      const newState: Partial<Nullable<KeyMap>> =
        typeof stateUpdater === 'function'
          ? stateUpdater(applyDefaultValues(stateRef.current, defaultValues))
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
        const query = enqueueQueryStringUpdate(
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
        emitter.emit(urlKey, { state: value, query })
      }
      return scheduleFlushToURL(adapter)
    },
    [
      stateKeys,
      history,
      shallow,
      scroll,
      throttleMs,
      startTransition,
      resolvedUrlKeys,
      adapter.updateUrl,
      adapter.getSearchParamsSnapshot,
      adapter.rateLimitFactor,
      defaultValues
    ]
  )

  const outputState = useMemo(
    () => applyDefaultValues(internalState, defaultValues),
    [internalState, defaultValues]
  )
  return [outputState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  urlKeys: Partial<Record<keyof KeyMap, string>>,
  searchParams: URLSearchParams,
  cachedQuery?: Record<string, string | null>,
  cachedState?: NullableValues<KeyMap>
): {
  state: NullableValues<KeyMap>
  hasChanged: boolean
} {
  let hasChanged = false
  const state = Object.keys(keyMap).reduce((out, stateKey) => {
    const urlKey = urlKeys?.[stateKey] ?? stateKey
    const { parse } = keyMap[stateKey]!
    const queuedQuery = getQueuedValue(urlKey)
    const query =
      queuedQuery === undefined
        ? (searchParams?.get(urlKey) ?? null)
        : queuedQuery
    if (cachedQuery && cachedState && (cachedQuery[urlKey] ?? null) === query) {
      // Cache hit
      out[stateKey as keyof KeyMap] = cachedState[stateKey] ?? null
      return out
    }
    // Cache miss
    hasChanged = true
    const value = query === null ? null : safeParse(parse, query, stateKey)
    out[stateKey as keyof KeyMap] = value ?? null
    if (cachedQuery) {
      cachedQuery[urlKey] = query
    }
    return out
  }, {} as NullableValues<KeyMap>)
  return { state, hasChanged }
}

function applyDefaultValues<KeyMap extends UseQueryStatesKeysMap>(
  state: NullableValues<KeyMap>,
  defaults: Partial<Values<KeyMap>>
) {
  return Object.fromEntries(
    Object.keys(state).map(key => [key, state[key] ?? defaults[key] ?? null])
  ) as Values<KeyMap>
}
