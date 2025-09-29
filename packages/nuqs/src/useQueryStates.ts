import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  type DefaultValueStore,
  useAdapter,
  useAdapterDefaultOptions,
  useAdapterProcessUrlSearchParams,
  useDefaultValueStore
} from './adapters/lib/context'
import type { Nullable, Options, UrlKeys } from './defs'
import { compareQuery } from './lib/compare'
import { debug } from './lib/debug'
import { error } from './lib/errors'
import { debounceController } from './lib/queues/debounce'
import { defaultRateLimit } from './lib/queues/rate-limiting'
import {
  globalThrottleQueue,
  type UpdateQueuePushArgs
} from './lib/queues/throttle'
import { safeParse } from './lib/safe-parse'
import { isAbsentFromUrl, type Query } from './lib/search-params'
import { emitter, type CrossHookSyncPayload } from './lib/sync'
import { type GenericParser } from './parsers'

type KeyMapValue<Type> = GenericParser<Type> &
  Options & {
    defaultValue?: Type
  }

export type UseQueryStatesKeysMap<Map = any> = {
  [Key in keyof Map]: KeyMapValue<Map[Key]>
} & {}

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
) => Partial<Nullable<Values<T>>> | null

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
  options: Partial<UseQueryStatesOptions<KeyMap>> = {}
): UseQueryStatesReturn<KeyMap> {
  const hookId = useId()
  const defaultOptions = useAdapterDefaultOptions()
  const processUrlSearchParams = useAdapterProcessUrlSearchParams()
  const defaultValueStore = useDefaultValueStore()

  const {
    history = 'replace',
    scroll = defaultOptions?.scroll ?? false,
    shallow = defaultOptions?.shallow ?? true,
    throttleMs = defaultRateLimit.timeMs,
    limitUrlUpdates = defaultOptions?.limitUrlUpdates,
    clearOnDefault = defaultOptions?.clearOnDefault ?? true,
    startTransition,
    urlKeys = defaultUrlKeys as UrlKeys<KeyMap>
  } = options

  type V = NullableValues<KeyMap>
  const stateKeys = Object.keys(keyMap).join(',')
  const resolvedUrlKeys = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(keyMap).map(key => [key, urlKeys[key] ?? key])
      ),
    [stateKeys, JSON.stringify(urlKeys)]
  )
  const adapter = useAdapter(Object.values(resolvedUrlKeys))
  const initialSearchParams = adapter.searchParams
  const queryRef = useRef<Record<string, Query | null>>({})

  // lazily initialize defaultValues in store
  for (const [stateKey, { defaultValue }] of Object.entries(keyMap)) {
    if (!(stateKey in defaultValueStore)) {
      defaultValueStore[stateKey] = defaultValue ?? null
    }
  }

  const queuedQueries = debounceController.useQueuedQueries(
    Object.values(resolvedUrlKeys)
  )
  const [internalState, setInternalState] = useState<V>(() => {
    const source = initialSearchParams ?? new URLSearchParams()
    return parseMap(keyMap, urlKeys, source, queuedQueries).state
  })

  const stateRef = useRef(internalState)
  debug(
    '[nuq+ %s `%s`] render - state: %O, iSP: %s',
    hookId,
    stateKeys,
    internalState,
    initialSearchParams
  )

  // Initialise the refs with the initial values
  if (
    Object.keys(queryRef.current).join('&') !==
    Object.values(resolvedUrlKeys).join('&')
  ) {
    const { state, hasChanged } = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queuedQueries,
      queryRef.current,
      stateRef.current
    )
    if (hasChanged) {
      debug('[nuq+ %s `%s`] State changed: %O', hookId, stateKeys, {
        state,
        initialSearchParams,
        queuedQueries,
        queryRef: queryRef.current,
        stateRef: stateRef.current
      })
      stateRef.current = state
      setInternalState(state)
    }
    queryRef.current = Object.fromEntries(
      Object.values(resolvedUrlKeys).map(urlKey => [
        urlKey,
        initialSearchParams?.get(urlKey) ?? null
      ])
    )
  }

  useEffect(() => {
    const { state, hasChanged } = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queuedQueries,
      queryRef.current,
      stateRef.current
    )
    if (hasChanged) {
      debug('[nuq+ %s `%s`] State changed: %O', hookId, stateKeys, {
        state,
        initialSearchParams,
        queuedQueries,
        queryRef: queryRef.current,
        stateRef: stateRef.current
      })
      stateRef.current = state
      setInternalState(state)
    }
  }, [
    Object.values(resolvedUrlKeys)
      .map(key => `${key}=${initialSearchParams?.get(key)}`)
      .join('&'),
    JSON.stringify(queuedQueries)
  ])

  // Sync all hooks together & with external URL changes
  useEffect(() => {
    function updateInternalState(state: V) {
      debug('[nuq+ %s `%s`] updateInternalState %O', hookId, stateKeys, state)
      setInternalState(state)
    }
    const handlers = Object.keys(keyMap).reduce(
      (handlers, stateKey) => {
        handlers[stateKey as keyof KeyMap] = ({
          state,
          query
        }: CrossHookSyncPayload) => {
          const defaultValue = defaultValueStore[stateKey]
          const urlKey = resolvedUrlKeys[stateKey]!
          // Note: cannot mutate in-place, the object ref must change
          // for the subsequent setState to pick it up.
          stateRef.current = {
            ...stateRef.current,
            [stateKey as keyof KeyMap]: state ?? defaultValue ?? null
          }
          queryRef.current[urlKey] = query
          debug(
            '[nuq+ %s `%s`] Cross-hook key sync %s: %O (default: %O). Resolved: %O',
            hookId,
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
      debug(
        '[nuq+ %s `%s`] Subscribing to sync for `%s`',
        hookId,
        urlKey,
        stateKeys
      )
      emitter.on(urlKey, handlers[stateKey]!)
    }
    return () => {
      for (const stateKey of Object.keys(keyMap)) {
        const urlKey = resolvedUrlKeys[stateKey]!
        debug(
          '[nuq+ %s `%s`] Unsubscribing to sync for `%s`',
          hookId,
          urlKey,
          stateKeys
        )
        emitter.off(urlKey, handlers[stateKey])
      }
    }
  }, [stateKeys, resolvedUrlKeys])

  const update = useCallback<SetValues<KeyMap>>(
    (stateUpdater, callOptions = {}) => {
      const nullMap = Object.fromEntries(
        Object.keys(keyMap).map(key => [key, null])
      ) as Nullable<KeyMap>
      const newState: Partial<Nullable<KeyMap>> =
        typeof stateUpdater === 'function'
          ? (stateUpdater(
              applyDefaultValues(stateRef.current, defaultValueStore)
            ) ?? nullMap)
          : (stateUpdater ?? nullMap)
      debug('[nuq+ %s `%s`] setState: %O', hookId, stateKeys, newState)
      let returnedPromise: Promise<URLSearchParams> | undefined = undefined
      let maxDebounceTime = 0
      const debounceAborts: Array<
        (p: Promise<URLSearchParams>) => Promise<URLSearchParams>
      > = []
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
        const query =
          value === null ? null : (parser.serialize ?? String)(value)
        emitter.emit(urlKey, { state: value, query })
        const update: UpdateQueuePushArgs = {
          key: urlKey,
          query,
          options: {
            // Call-level options take precedence over individual parser options
            // which take precedence over global options
            history: callOptions.history ?? parser.history ?? history,
            shallow: callOptions.shallow ?? parser.shallow ?? shallow,
            scroll: callOptions.scroll ?? parser.scroll ?? scroll,
            startTransition:
              callOptions.startTransition ??
              parser.startTransition ??
              startTransition
          }
        }
        if (
          callOptions?.limitUrlUpdates?.method === 'debounce' ||
          limitUrlUpdates?.method === 'debounce' ||
          parser.limitUrlUpdates?.method === 'debounce'
        ) {
          if (update.options.shallow === true) {
            console.warn(error(422))
          }
          const timeMs =
            callOptions?.limitUrlUpdates?.timeMs ??
            limitUrlUpdates?.timeMs ??
            parser.limitUrlUpdates?.timeMs ??
            defaultRateLimit.timeMs
          const debouncedPromise = debounceController.push(
            update,
            timeMs,
            adapter
          )
          if (maxDebounceTime < timeMs) {
            // The largest debounce is likely to be the last URL update,
            // so we keep that Promise to return it.
            returnedPromise = debouncedPromise
            maxDebounceTime = timeMs
          }
        } else {
          const timeMs =
            callOptions?.limitUrlUpdates?.timeMs ??
            parser?.limitUrlUpdates?.timeMs ??
            limitUrlUpdates?.timeMs ??
            callOptions.throttleMs ??
            parser.throttleMs ??
            throttleMs
          debounceAborts.push(debounceController.abort(urlKey))
          globalThrottleQueue.push(update, timeMs)
        }
      }
      // We need to flush the throttle queue, but we may have a pending
      // debounced update that will resolve afterwards.
      const globalPromise = debounceAborts.reduce(
        (previous, fn) => fn(previous),
        globalThrottleQueue.flush(adapter, processUrlSearchParams)
      )
      return returnedPromise ?? globalPromise
    },
    [
      stateKeys,
      history,
      shallow,
      scroll,
      throttleMs,
      limitUrlUpdates?.method,
      limitUrlUpdates?.timeMs,
      startTransition,
      resolvedUrlKeys,
      adapter.updateUrl,
      adapter.getSearchParamsSnapshot,
      adapter.rateLimitFactor,
      processUrlSearchParams,
      defaultValueStore
    ]
  )

  const outputState = useMemo(
    () =>
      applyDefaultValues(
        internalState,
        defaultValueStore as Partial<Values<KeyMap>>
      ),
    [internalState, defaultValueStore]
  )
  return [outputState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  urlKeys: Partial<Record<keyof KeyMap, string>>,
  searchParams: URLSearchParams,
  queuedQueries: Record<string, Query | null | undefined>,
  cachedQuery?: Record<string, Query | null>,
  cachedState?: NullableValues<KeyMap>
): {
  state: NullableValues<KeyMap>
  hasChanged: boolean
} {
  let hasChanged = false
  const state = Object.entries(keyMap).reduce((out, [stateKey, parser]) => {
    const urlKey = urlKeys?.[stateKey] ?? stateKey
    const queuedQuery = queuedQueries[urlKey]
    const fallbackValue = parser.type === 'multi' ? [] : null
    const query =
      queuedQuery === undefined
        ? ((parser.type === 'multi'
            ? searchParams?.getAll(urlKey)
            : searchParams?.get(urlKey)) ?? fallbackValue)
        : queuedQuery
    if (
      cachedQuery &&
      cachedState &&
      compareQuery(cachedQuery[urlKey] ?? fallbackValue, query)
    ) {
      // Cache hit
      out[stateKey as keyof KeyMap] = cachedState[stateKey] ?? null
      return out
    }
    // Cache miss
    hasChanged = true
    const value = isAbsentFromUrl(query)
      ? null
      : // we have properly narrowed `query` here, but TS doesn't keep track of that
        safeParse(parser.parse, query as string & Array<string>, urlKey)

    out[stateKey as keyof KeyMap] = value ?? null
    if (cachedQuery) {
      cachedQuery[urlKey] = query
    }
    return out
  }, {} as NullableValues<KeyMap>)

  if (!hasChanged) {
    // check that keyMap keys have not changed
    const keyMapKeys = Object.keys(keyMap)
    const cachedStateKeys = Object.keys(cachedState ?? {})
    hasChanged =
      keyMapKeys.length !== cachedStateKeys.length ||
      keyMapKeys.some(key => !cachedStateKeys.includes(key))
  }

  return { state, hasChanged }
}

function applyDefaultValues<KeyMap extends UseQueryStatesKeysMap>(
  state: NullableValues<KeyMap>,
  defaults: DefaultValueStore
) {
  return Object.fromEntries(
    Object.keys(state).map(key => [key, state[key] ?? defaults[key] ?? null])
  ) as Values<KeyMap>
}
