import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  useAdapter,
  useAdapterDefaultOptions,
  useAdapterProcessUrlSearchParams
} from './adapters/lib/context'
import type { Nullable, Options, UrlKeys } from './defs'
import { compareQuery, isEqual } from './lib/compare'
import { debug } from './lib/debug'
import { debounceController, useQueuedQueries } from './lib/queues/debounce'
import { defaultRateLimit } from './lib/queues/rate-limiting'
import {
  globalThrottleQueue,
  type UpdateQueuePushArgs
} from './lib/queues/throttle'
import { safeParse } from './lib/safe-parse'
import { isAbsentFromUrl, type Query } from './lib/search-params'
import { emitter, type CrossHookSyncPayload } from './lib/sync'
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
  const urlKeyList = Object.values(resolvedUrlKeys)
  const adapter = useAdapter(urlKeyList)
  const initialSearchParams = adapter.searchParams
  // Tracks the URL source (search params + queued queries) the internal state
  // was last reconciled against during render. See the reconciliation block below.
  const lastSyncKeyRef = useRef<string | null>(null)
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
  const queuedQueries = useQueuedQueries(urlKeyList)
  // Seed the query cache from the same parse as the state, so the first
  // render-time reconcile below hits the cache instead of setting state
  // during render (one extra render on mount when the URL holds a value).
  // The initializer returns the cache rather than writing it to a ref:
  // initializers must stay pure (for StrictMode compatibility).
  const [initial] = useState(() => {
    const cachedQuery: Record<string, Query | null> = {}
    const [, state] = parseMap(
      keyMap,
      resolvedUrlKeys,
      initialSearchParams,
      queuedQueries,
      cachedQuery
    )
    return [state, cachedQuery] as const
  })
  const queryRef = useRef(initial[1])
  const [internalState, setInternalState] = useState<V>(initial[0])

  const stateRef = useRef(internalState)
  // Tracks the latest state parsed from the URL. Matching identity marks the
  // cache as URL-derived; optimistic state stays in React's update queue.
  const urlStateRef = useRef(internalState)

  // Identifies the current URL source (resolved search params + queued queries).
  // Mirrors the dependencies of the URL sync effect below so that render-time
  // reconciliation reacts to the same external changes, and never to internal
  // (optimistic) updates which don't immediately alter the URL source.
  const getSearchParamsSyncKey = (searchParams: URLSearchParams) =>
    JSON.stringify([
      urlKeyList.map(key => [key, searchParams.getAll(key)]),
      queuedQueries
    ])
  const searchParamsSyncKey = getSearchParamsSyncKey(initialSearchParams)
  // Adopts the current URL value into the internal state when it has changed.
  // Used both during render (below) and from the effect backstop further down.
  const reconcile = () => {
    const [hasChanged, state] = parseMap(
      keyMap,
      resolvedUrlKeys,
      initialSearchParams,
      queuedQueries,
      queryRef.current,
      stateRef.current
    )
    if (hasChanged) {
      debug(1, hookId, stateKeys, state)
      stateRef.current = state
      urlStateRef.current = state
      setInternalState(state)
    }
    return hasChanged
  }
  // Reconcile during render, both on key-set changes (initialisation) and when
  // the URL source changes. The effect below does the same, but effects are
  // detached while a subtree is hidden under `<Activity>` and only re-run after
  // the first commit on reveal, so without this, that first render would paint
  // the value captured while hidden (#1444). Gating on `searchParamsSyncKey`
  // means we only adopt the URL when its source actually changed, never
  // reverting an optimistic update not yet propagated to the adapter's params.
  //
  // The URL-change branch is further gated to renders happening on the pathname
  // the hook last committed against: during a route transition the router can
  // render an outgoing/incoming page against the other route's in-flight URL,
  // and adopting it there produces cross-page renders React discards (#1293).
  const keysChanged =
    Object.keys(queryRef.current).join('&') !== urlKeyList.join('&')
  // `committedPathnameRef` is only ever assigned from the client,
  // so a null value covers both SSR and the first client render.
  const onCommittedPathname =
    committedPathnameRef.current === null ||
    committedPathnameRef.current === (adapter.pathname ?? location.pathname)
  if (keysChanged) {
    lastSyncKeyRef.current = searchParamsSyncKey
    reconcile()
    queryRef.current = Object.fromEntries(
      Object.entries(resolvedUrlKeys).map(([key, urlKey]) => [
        urlKey,
        keyMap[key]?.type === 'multi'
          ? initialSearchParams.getAll(urlKey)
          : initialSearchParams.get(urlKey)
      ])
    )
  } else {
    // Skipped on key-set changes: `stateRef` may still describe the previous
    // key map, so restoring from it would bring back removed keys.
    let didReconcileState = false
    if (onCommittedPathname && lastSyncKeyRef.current !== searchParamsSyncKey) {
      lastSyncKeyRef.current = searchParamsSyncKey
      didReconcileState = reconcile()
    }
    if (
      !didReconcileState &&
      internalState !== stateRef.current &&
      stateRef.current === urlStateRef.current
    ) {
      // Recover URL-derived state from a render React abandoned. Optimistic
      // state is excluded above because React must preserve its update lane.
      if (
        onCommittedPathname ||
        (adapter.pathname === undefined &&
          lastSyncKeyRef.current ===
            getSearchParamsSyncKey(new URLSearchParams(location.search)))
      ) {
        setInternalState(stateRef.current)
      }
    }
  }

  // Backstop for the render-time reconciliation above: covers external changes
  // landing in renders React discards before commit (e.g. interrupted
  // transitions). Shares the `searchParamsSyncKey` dependency, so they can't
  // drift. Also records the pathname of this committed reconciliation, which
  // gates the render-time branch above (effects don't run while detached, so
  // this freezes at the pathname the hook was last attached on).
  // `adapter.pathname` is a dependency too: a same-search cross-route navigation
  // leaves `searchParamsSyncKey` unchanged, so without it the recorded pathname
  // would stay frozen on the previous route and wrongly gate off the next
  // render-time reconcile there (a stale frame until the next URL change, #1273).
  useEffect(() => {
    committedPathnameRef.current = adapter.pathname ?? location.pathname
    reconcile()
  }, [searchParamsSyncKey, adapter.pathname])

  // Sync all hooks together & with external URL changes
  useEffect(() => {
    const subscriptions: Array<
      readonly [string, (payload: CrossHookSyncPayload) => void]
    > = []
    for (const [stateKey, urlKey] of Object.entries(resolvedUrlKeys)) {
      const handler = ({ state, query }: CrossHookSyncPayload) => {
        const previousState = stateRef.current
        const wasUrlState = previousState === urlStateRef.current
        // Update the cache before scheduling React state. A higher-priority
        // render may run before React evaluates the updater below; it must see
        // this optimistic value as cached state, not adopt it as URL state.
        queryRef.current[urlKey] = query
        const nextCachedState = Object.is(
          previousState[stateKey] ?? null,
          state
        )
          ? previousState
          : {
              ...previousState,
              [stateKey as keyof KeyMap]: state
            }
        stateRef.current = nextCachedState
        setInternalState(currentState => {
          if (
            Object.is(currentState[stateKey] ?? null, state) &&
            (currentState === previousState || !wasUrlState)
          ) {
            debug(
              2,
              hookId,
              stateKeys,
              urlKey,
              state,
              keyMap[stateKey]?.defaultValue,
              currentState
            )
            // bail out by returning the current state
            return currentState
          }
          // Rebased updates need a new object reference.
          const nextState =
            currentState === previousState
              ? nextCachedState
              : {
                  ...currentState,
                  ...(wasUrlState && previousState),
                  [stateKey as keyof KeyMap]: state
                }
          debug(
            3,
            hookId,
            stateKeys,
            urlKey,
            state,
            keyMap[stateKey]?.defaultValue,
            nextState
          )
          return nextState
        })
      }
      debug(4, hookId, urlKey, stateKeys)
      emitter.on(urlKey, handler)
      subscriptions.push([urlKey, handler] as const)
    }
    return () => {
      for (const [urlKey, handler] of subscriptions) {
        debug(5, hookId, urlKey, stateKeys)
        emitter.off(urlKey, handler)
      }
    }
  }, [stateKeys, resolvedUrlKeys])

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
        const urlKey = resolvedUrlKeys[stateKey]!
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
        const resolvedLimitUrlUpdates =
          callOptions.limitUrlUpdates ??
          parser.limitUrlUpdates ??
          limitUrlUpdates
        if (resolvedLimitUrlUpdates?.method === 'debounce') {
          const timeMs =
            resolvedLimitUrlUpdates.timeMs ?? defaultRateLimit.timeMs
          const debouncedPromise = debounceController.push(
            update,
            timeMs,
            adapter,
            processUrlSearchParams
          )
          if (maxDebounceTime < timeMs) {
            // The largest debounce is likely to be the last URL update,
            // so we keep that Promise to return it.
            returnedPromise = debouncedPromise
            maxDebounceTime = timeMs
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
  searchParams: URLSearchParams,
  queuedQueries: Record<string, Query | null | undefined>,
  cachedQuery: Record<string, Query | null> = {},
  cachedState: Partial<NullableValues<KeyMap>> = {}
): [hasChanged: boolean, state: NullableValues<KeyMap>] {
  let hasChanged = false
  const state = Object.entries(keyMap).reduce((out, [stateKey, parser]) => {
    const urlKey = resolvedUrlKeys[stateKey]!
    const queuedQuery = getOwn(queuedQueries, urlKey)
    // `getAll` returns an empty array and `get` returns null when the key is
    // absent, so URL reads need no fallback; the cached query does (below).
    const fallbackValue = parser.type === 'multi' ? [] : null
    const query =
      queuedQuery === undefined
        ? parser.type === 'multi'
          ? searchParams.getAll(urlKey)
          : searchParams.get(urlKey)
        : queuedQuery
    const cachedStateValue = getOwn(cachedState, stateKey)
    if (
      cachedStateValue !== undefined &&
      compareQuery(getOwn(cachedQuery, urlKey) ?? fallbackValue, query)
    ) {
      // Cache hit
      out[stateKey as keyof KeyMap] = cachedStateValue
      return out
    }
    // Cache miss
    hasChanged = true
    const value = isAbsentFromUrl(query)
      ? null
      : // we have properly narrowed `query` here, but TS doesn't keep track of that
        safeParse(parser.parse, query as string & Array<string>, urlKey)

    out[stateKey as keyof KeyMap] = value ?? null
    cachedQuery[urlKey] = query
    return out
  }, {} as NullableValues<KeyMap>)

  // Detect removed keys.
  // Every key of the map hit the cache above, so it exists in the cached state:
  // the key sets can only differ by keys that were removed.
  hasChanged ||= Object.keys(state).length !== Object.keys(cachedState).length

  return [hasChanged, state]
}

function applyDefaultValues<KeyMap extends UseQueryStatesKeysMap>(
  state: NullableValues<KeyMap>,
  keyMap: KeyMap
) {
  return Object.fromEntries(
    Object.keys(state).map(key => [
      key,
      state[key] ?? keyMap[key]?.defaultValue ?? null
    ])
  ) as Values<KeyMap>
}
