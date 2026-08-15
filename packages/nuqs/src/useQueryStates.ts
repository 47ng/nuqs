import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  useAdapter,
  useAdapterDefaultOptions,
  useAdapterProcessUrlSearchParams
} from './adapters/lib/context'
import type { Nullable, Options, UrlKeys } from './defs'
import { compareQuery, isEqual } from './lib/compare'
import { debug } from './lib/debug'
import {
  getParseCacheVersion,
  parseWithCache,
  retainParseCache
} from './lib/parse-cache'
import { debounceController } from './lib/queues/debounce'
import { defaultRateLimit } from './lib/queues/rate-limiting'
import {
  globalThrottleQueue,
  type UpdateQueuePushArgs
} from './lib/queues/throttle'
import { useSyncExternalStores } from './lib/queues/useSyncExternalStores'
import { isAbsentFromUrl, type Query } from './lib/search-params'
import { getOwn, getUrlKey } from './lib/url-keys'
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
type RawValue = [query: Query | null, cacheVersion?: number]

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
// Defaults may not be JSON-serializable and are compared with parser eq below.
const omitDefaultValue = (key: string, value: unknown) =>
  key === 'defaultValue' ? undefined : value

// Hoisted for referential stability: subscriptions only churn when the
// watched keys change, not on every render.
const subscribeToOverlay = (
  key: string,
  callback: () => void
): (() => void) => {
  retainParseCache(key, 1)
  const unsubscribe = debounceController.throttleQueue.sync.on(key, callback)
  return () => {
    retainParseCache(key, -1)
    unsubscribe()
  }
}

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

  const {
    history = defaultOptions?.history ?? 'replace',
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
  const cachedKeyMapRef = useRef(keyMap)
  const cachedKeyMap = cachedKeyMapRef.current
  const stableKeyMap =
    JSON.stringify(Object.entries(cachedKeyMap), omitDefaultValue) ===
      JSON.stringify(Object.entries(keyMap), omitDefaultValue) &&
    Object.entries(keyMap).every(([key, parser]) => {
      if (cachedKeyMap[key]?.startTransition !== parser.startTransition) {
        return false
      }
      const previousDefault = cachedKeyMap[key]?.defaultValue
      const currentDefault = parser.defaultValue
      if (Object.is(previousDefault, currentDefault)) {
        return true
      }
      return (
        previousDefault !== undefined &&
        currentDefault !== undefined &&
        parser.eq?.(previousDefault, currentDefault) === true
      )
    })
      ? cachedKeyMap
      : keyMap
  cachedKeyMapRef.current = stableKeyMap
  const resolvedUrlKeys = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(keyMap).map(key => [key, getUrlKey(urlKeys, key)])
      ),
    [stateKeys, JSON.stringify(urlKeys)]
  )
  const urlKeyList = useMemo(
    () => Object.values(resolvedUrlKeys),
    [resolvedUrlKeys]
  )
  const adapter = useAdapter(urlKeyList)
  const initialSearchParams = adapter.searchParams
  // The pathname this hook last reconciled against from a committed render
  // (set by the effect backstop below). The render-time reconcile is skipped when
  // the current pathname no longer matches it: that means the component is
  // rendering through a navigation transition for a different route (an outgoing
  // or incoming page kept alive by the router, e.g. under cacheComponents),
  // where adopting the in-flight URL would corrupt speculative renders (#1293).
  // Both sides of the comparison use the adapter's pathname when provided
  // (`usePathname()` in Next.js), which tracks the destination route from the
  // start of a transition; the live `location.pathname` lags until the browser
  // URL commits, which would misjudge a same-route reveal as a cross-route
  // render and skip the reconcile (#1273). A genuine `<Activity>` reveal keeps
  // the same pathname, so it still reconciles.
  const committedPathnameRef = useRef<string | null>(null)
  const detachedRef = useRef(false)
  const isMultiUrlKey = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(resolvedUrlKeys).map(([stateKey, urlKey]) => [
          urlKey,
          keyMap[stateKey]?.type === 'multi'
        ])
      ),
    [resolvedUrlKeys]
  )
  // The raw optimistic value and parse-cache version for a url key. The query
  // comes from the global pending updates overlay (throttle & debounce queues),
  // falling back to the adapter's committed search params. Reading the committed
  // value live in the snapshot (rather than from state synced by an effect) keeps
  // it fresh even on the first render after an `<Activity>` subtree is revealed:
  // its effects — and thus the overlay subscription — were detached while hidden
  // and missed updates (#1444). The cache version makes a same-query write with
  // a new value identity observable to sibling hooks.
  const getRawValue = useCallback(
    (urlKey: string): RawValue => {
      const queued = debounceController.getQueuedQuery(urlKey)
      const query =
        queued !== undefined
          ? queued
          : getOwn(isMultiUrlKey, urlKey)
            ? initialSearchParams.getAll(urlKey)
            : initialSearchParams.get(urlKey)
      return [query, getParseCacheVersion(urlKey)]
    },
    [initialSearchParams, isMultiUrlKey]
  )
  // Referentially stable while the raw queries and cache versions of the watched
  // keys are unchanged, so identity comparison detects URL source changes and
  // same-query identity publications. Internal (optimistic) updates also change
  // this identity, but the writer records the tuple in queryRef before the
  // notification renders, so it cache-hits and keeps the exact written value.
  const rawValues = useSyncExternalStores(
    urlKeyList,
    subscribeToOverlay,
    getRawValue
  )
  const [internalState, setInternalState] = useState<V>(
    () => parseMap(keyMap, resolvedUrlKeys, rawValues).state
  )
  // Starts at the source used by the state initializer. The search string is
  // published with it after commit so discarded renders can be distinguished
  // from hidden cross-route renders without reading location during SSR.
  const lastSyncRef = useRef<[Record<string, RawValue>, string]>([
    rawValues,
    ''
  ])

  const stateRef = useRef(internalState)
  // Tracks the latest state adopted from a URL source. Optimistic updates only
  // advance stateRef, so render-time recovery can preserve their React lane.
  const urlStateRef = useRef(internalState)
  // Adopts the current URL value into the internal state when it has changed.
  // Used both during render (below) and from the effect backstop further down.
  const reconcile = (cachedRawValues = lastSyncRef.current[0]) => {
    let { state, hasChanged } = parseMap(
      keyMap,
      resolvedUrlKeys,
      rawValues,
      cachedRawValues,
      stateRef.current
    )
    hasChanged ||= stableKeyMap !== cachedKeyMap
    if (hasChanged) {
      debug(1, hookId, stateKeys, state)
      stateRef.current = state
      urlStateRef.current = state
      setInternalState(state)
    }
    lastSyncRef.current = [rawValues, location.search]
    return hasChanged
  }
  // Reconcile during render, both on key-set changes (initialisation) and when
  // the URL source changes. The effect below does the same, but effects are
  // detached while a subtree is hidden under `<Activity>` and only re-run after
  // the first commit on reveal, so without this, that first render would paint
  // the value captured while hidden (#1444). Gating on the `rawValues` identity
  // means we only adopt the URL when its source actually changed.
  //
  // Detached cross-route renders are normally ignored. A discarded render is
  // different: the last reconciled source already matches the live browser
  // search, so restore the state React abandoned even though the pathname moved.
  const discardedSourceMatchesLocation =
    adapter.pathname === undefined &&
    committedPathnameRef.current !== null &&
    lastSyncRef.current[0] !== rawValues &&
    lastSyncRef.current[1] === location.search &&
    committedPathnameRef.current !== location.pathname
  if (
    (discardedSourceMatchesLocation ||
      ((!detachedRef.current ||
        committedPathnameRef.current ===
          (adapter.pathname ?? location.pathname)) &&
        (lastSyncRef.current[0] === rawValues || !reconcile()))) &&
    internalState !== stateRef.current &&
    stateRef.current === urlStateRef.current
  ) {
    setInternalState(stateRef.current)
  }

  // Backstop for the render-time reconciliation above: covers external changes
  // landing in renders React discards before commit (e.g. interrupted
  // transitions). Shares the `rawValues` dependency, so they can't drift.
  // Also records the pathname of this committed reconciliation, which
  // gates the render-time branch above (effects don't run while detached, so
  // this freezes at the pathname the hook was last attached on).
  // `adapter.pathname` is a dependency too: a same-search cross-route navigation
  // leaves `rawValues` unchanged, so without it the recorded pathname
  // would stay frozen on the previous route and wrongly gate off the next
  // render-time reconcile there (a stale frame until the next URL change, #1273).
  useEffect(() => {
    detachedRef.current = false
    if (!discardedSourceMatchesLocation) {
      committedPathnameRef.current = adapter.pathname ?? location.pathname
      reconcile()
    }
    return () => {
      detachedRef.current = true
    }
  }, [rawValues, adapter.pathname])

  const update = useCallback<SetValues<KeyMap>>(
    (stateUpdater, callOptions = {}) => {
      const requestedState =
        typeof stateUpdater === 'function'
          ? stateUpdater(applyDefaultValues(stateRef.current, stableKeyMap))
          : stateUpdater
      // `null` (or an updater returning `null`) clears every key of the map.
      const newState: Partial<Nullable<KeyMap>> =
        requestedState ??
        (Object.fromEntries(
          Object.keys(stableKeyMap).map(key => [key, null])
        ) as Nullable<KeyMap>)
      debug(6, hookId, stateKeys, newState)
      let returnedPromise: Promise<URLSearchParams> | undefined = undefined
      let maxDebounceTime = 0
      // One abort per key sent to the throttle queue, so a non-empty list
      // also means the queue has something to flush.
      const debounceAborts: Array<
        (p: Promise<URLSearchParams>) => Promise<URLSearchParams>
      > = []
      for (let [stateKey, value] of Object.entries(newState)) {
        const parser = getOwn(stableKeyMap, stateKey)
        const urlKey = getOwn(resolvedUrlKeys, stateKey)
        if (!parser || urlKey === undefined || value === undefined) {
          continue
        }
        if (
          (callOptions.clearOnDefault ??
            parser.clearOnDefault ??
            clearOnDefault) &&
          value !== null &&
          parser.defaultValue !== undefined &&
          (parser.eq ?? isEqual)(value, parser.defaultValue)
        ) {
          value = null
        }
        const query =
          value === null ? null : (parser.serialize ?? String)(value)
        // Optimistic local adoption: the writer keeps the exact value
        // identity it was given (===), unless clearOnDefault rewrote it to
        // the parser's defaultValue above. Seed the parse cache before the
        // overlay notification so hooks using the same parser adopt that
        // identity; hooks using another parser still re-parse the raw query.
        const nextValue = value ?? parser.defaultValue ?? null
        if (value !== null) {
          parseWithCache(
            urlKey,
            parser.parse,
            query as string & Array<string>,
            value
          )
        }
        const previousState = stateRef.current
        const wasCached = Object.is(
          previousState[stateKey] ?? parser.defaultValue ?? null,
          nextValue
        )
        const wasUrlState = previousState === urlStateRef.current
        // Update both caches before scheduling React state. A higher-priority
        // render may run before React evaluates the updater below; it must see
        // the optimistic query as cached state without adopting its React lane.
        lastSyncRef.current[0][urlKey] = [query, getParseCacheVersion(urlKey)]
        const nextCachedState = wasCached
          ? previousState
          : {
              ...previousState,
              [stateKey as keyof KeyMap]: nextValue
            }
        stateRef.current = nextCachedState
        setInternalState(currentState => {
          const currentValue =
            currentState[stateKey] ?? parser.defaultValue ?? null
          if (
            Object.is(currentValue, nextValue) &&
            !(wasUrlState && currentState !== previousState)
          ) {
            debug(
              2,
              hookId,
              stateKeys,
              urlKey,
              value,
              parser.defaultValue,
              currentState
            )
            // bail out by returning the current state
            return currentState
          }
          // Rebase a write which interrupted URL reconciliation on the latest
          // URL-derived siblings; otherwise preserve React's current lane.
          const nextState =
            currentState === previousState
              ? nextCachedState
              : {
                  ...currentState,
                  ...(wasUrlState ? previousState : {}),
                  [stateKey as keyof KeyMap]: nextValue
                }
          debug(
            3,
            hookId,
            stateKeys,
            urlKey,
            value,
            parser.defaultValue,
            nextState
          )
          return nextState
        })
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
        const resolvedLimitUrlUpdates =
          callOptions.limitUrlUpdates ??
          parser.limitUrlUpdates ??
          limitUrlUpdates
        const isDebounce = resolvedLimitUrlUpdates?.method === 'debounce'
        const debounceTimeMs =
          resolvedLimitUrlUpdates?.timeMs ?? defaultRateLimit.timeMs
        // debounce(Infinity) takes the throttle path: it lands in the pending
        // updates overlay (visible to other hooks on the key, including ones
        // mounting later) and defers the flush like throttle(Infinity) does.
        if (isDebounce && Number.isFinite(debounceTimeMs)) {
          const debouncedPromise = debounceController.push(
            update,
            debounceTimeMs,
            adapter,
            processUrlSearchParams
          )
          if (maxDebounceTime < debounceTimeMs) {
            // The largest debounce is likely to be the last URL update,
            // so we keep that Promise to return it.
            returnedPromise = debouncedPromise
            maxDebounceTime = debounceTimeMs
          }
        } else {
          const timeMs =
            resolvedLimitUrlUpdates?.timeMs ??
            callOptions.throttleMs ??
            parser.throttleMs ??
            throttleMs
          debounceAborts.push(debounceController.abort(urlKey))
          globalThrottleQueue.push(update, timeMs)
        }
      }
      // We need to flush the throttle queue, but we may have a pending
      // debounced update that will resolve afterwards.
      let globalPromise = debounceAborts.length
        ? globalThrottleQueue.flush(adapter, processUrlSearchParams)
        : globalThrottleQueue.getPendingPromise(adapter)
      for (const abort of debounceAborts) {
        globalPromise = abort(globalPromise)
      }
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
      clearOnDefault,
      stableKeyMap,
      resolvedUrlKeys,
      adapter.updateUrl,
      adapter.getSearchParamsSnapshot,
      adapter.rateLimitFactor,
      processUrlSearchParams
    ]
  )

  const outputState = useMemo(
    () => applyDefaultValues(internalState, stableKeyMap),
    [internalState, stableKeyMap]
  )
  return [outputState, update]
}

// --

function parseMap<KeyMap extends UseQueryStatesKeysMap>(
  keyMap: KeyMap,
  resolvedUrlKeys: Record<string, string>,
  rawValues: Record<string, RawValue>,
  cachedRawValues?: Record<string, RawValue> | null,
  cachedState?: NullableValues<KeyMap>
): {
  state: NullableValues<KeyMap>
  hasChanged: boolean
} {
  let hasChanged = false
  const state = {} as NullableValues<KeyMap>
  for (const [stateKey, parser] of Object.entries(keyMap)) {
    const urlKey = getOwn(resolvedUrlKeys, stateKey)!
    const rawValue = getOwn(rawValues, urlKey) ?? [
      parser.type === 'multi' ? [] : null
    ]
    const query = rawValue[0]
    const cachedRawValue = cachedRawValues && getOwn(cachedRawValues, urlKey)
    const cachedStateValue = cachedState && getOwn(cachedState, stateKey)
    if (
      cachedRawValue &&
      cachedStateValue !== undefined &&
      cachedRawValue[1] === rawValue[1] &&
      compareQuery(cachedRawValue[0], query)
    ) {
      state[stateKey as keyof KeyMap] = cachedStateValue
      continue
    }
    hasChanged = true

    const value = isAbsentFromUrl(query)
      ? null
      : // we have properly narrowed `query` here, but TS doesn't keep track of that
        parseWithCache(urlKey, parser.parse, query as string & Array<string>)

    state[stateKey as keyof KeyMap] = value ?? null
  }
  return { state, hasChanged }
}

function applyDefaultValues<KeyMap extends UseQueryStatesKeysMap>(
  state: NullableValues<KeyMap>,
  keyMap: KeyMap
) {
  return Object.fromEntries(
    Object.keys(state).map(key => [
      key,
      getOwn(state, key) ?? getOwn(keyMap, key)?.defaultValue ?? null
    ])
  ) as Values<KeyMap>
}
