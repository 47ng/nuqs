import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  useAdapter,
  useAdapterDefaultOptions,
  useAdapterProcessUrlSearchParams
} from './adapters/lib/context'
import type { Nullable, Options, UrlKeys } from './defs'
import { compareQuery } from './lib/compare'
import { debug } from './lib/debug'
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
  const queuedQueries = debounceController.useQueuedQueries(
    Object.values(resolvedUrlKeys)
  )
  const [internalState, setInternalState] = useState<V>(
    () => parseMap(keyMap, urlKeys, initialSearchParams, queuedQueries).state
  )

  const stateRef = useRef(internalState)

  // Identifies the current URL source (resolved search params + queued queries).
  // Mirrors the dependencies of the URL sync effect below so that render-time
  // reconciliation reacts to the same external changes, and never to internal
  // (optimistic) updates which don't immediately alter the URL source.
  const searchParamsSyncKey =
    Object.values(resolvedUrlKeys)
      .map(key => `${key}=${initialSearchParams.getAll(key)}`)
      .join('&') + JSON.stringify(queuedQueries)
  // Adopts the current URL value into the internal state when it has changed.
  // Used both during render (below) and from the effect backstop further down.
  const reconcile = () => {
    const { state, hasChanged } = parseMap(
      keyMap,
      urlKeys,
      initialSearchParams,
      queuedQueries,
      queryRef.current,
      stateRef.current
    )
    if (hasChanged) {
      debug(1, hookId, stateKeys, state)
      stateRef.current = state
      setInternalState(state)
    }
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
    Object.keys(queryRef.current).join('&') !==
    Object.values(resolvedUrlKeys).join('&')
  // `committedPathnameRef` is only ever assigned from the client,
  // so a null value covers both SSR and the first client render.
  const onCommittedPathname =
    committedPathnameRef.current === null ||
    committedPathnameRef.current === (adapter.pathname ?? location.pathname)
  if (
    keysChanged ||
    (onCommittedPathname && lastSyncKeyRef.current !== searchParamsSyncKey)
  ) {
    lastSyncKeyRef.current = searchParamsSyncKey
    reconcile()
    if (keysChanged) {
      queryRef.current = Object.fromEntries(
        Object.entries(resolvedUrlKeys).map(([key, urlKey]) => {
          const parser = keyMap[key]
          return [
            urlKey,
            parser?.type === 'multi'
              ? initialSearchParams.getAll(urlKey)
              : (initialSearchParams.get(urlKey) ?? null)
          ]
        })
      )
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
    const handlers = Object.keys(keyMap).reduce(
      (handlers, stateKey) => {
        handlers[stateKey as keyof KeyMap] = ({
          state,
          query
        }: CrossHookSyncPayload) => {
          setInternalState(currentState => {
            const { defaultValue } = keyMap[stateKey]!
            const urlKey = resolvedUrlKeys[stateKey]!
            const nextValue = state ?? defaultValue ?? null
            const currentValue = currentState[stateKey] ?? defaultValue ?? null

            if (Object.is(currentValue, nextValue)) {
              debug(
                2,
                hookId,
                stateKeys,
                urlKey,
                state,
                defaultValue,
                stateRef.current
              )
              // bail out by returning the current state
              return currentState
            }
            // Note: cannot mutate in-place, the object ref must change
            // for the subsequent setState to pick it up.
            stateRef.current = {
              ...stateRef.current,
              [stateKey as keyof KeyMap]: nextValue
            }
            queryRef.current[urlKey] = query
            debug(
              3,
              hookId,
              stateKeys,
              urlKey,
              state,
              defaultValue,
              stateRef.current
            )
            return stateRef.current
          })
        }
        return handlers
      },
      {} as Record<keyof KeyMap, (payload: CrossHookSyncPayload) => void>
    )

    for (const stateKey of Object.keys(keyMap)) {
      const urlKey = resolvedUrlKeys[stateKey]!
      debug(4, hookId, urlKey, stateKeys)
      emitter.on(urlKey, handlers[stateKey]!)
    }
    return () => {
      for (const stateKey of Object.keys(keyMap)) {
        const urlKey = resolvedUrlKeys[stateKey]!
        debug(5, hookId, urlKey, stateKeys)
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
              applyDefaultValues(stateRef.current, defaultValues)
            ) ?? nullMap)
          : (stateUpdater ?? nullMap)
      debug(6, hookId, stateKeys, newState)
      let returnedPromise: Promise<URLSearchParams> | undefined = undefined
      let maxDebounceTime = 0
      let doFlush = false
      const debounceAborts: Array<
        (p: Promise<URLSearchParams>) => Promise<URLSearchParams>
      > = []
      for (let [stateKey, value] of Object.entries(newState)) {
        const parser = keyMap[stateKey]
        const urlKey = resolvedUrlKeys[stateKey]!
        if (!parser || value === undefined) {
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
          const timeMs =
            callOptions?.limitUrlUpdates?.timeMs ??
            limitUrlUpdates?.timeMs ??
            parser.limitUrlUpdates?.timeMs ??
            defaultRateLimit.timeMs
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
            callOptions?.limitUrlUpdates?.timeMs ??
            parser?.limitUrlUpdates?.timeMs ??
            limitUrlUpdates?.timeMs ??
            callOptions.throttleMs ??
            parser.throttleMs ??
            throttleMs
          debounceAborts.push(debounceController.abort(urlKey))
          globalThrottleQueue.push(update, timeMs)
          doFlush = true
        }
      }
      // We need to flush the throttle queue, but we may have a pending
      // debounced update that will resolve afterwards.
      const globalPromise = debounceAborts.reduce(
        (previous, fn) => fn(previous),
        doFlush
          ? globalThrottleQueue.flush(adapter, processUrlSearchParams)
          : globalThrottleQueue.getPendingPromise(adapter)
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
            ? searchParams.getAll(urlKey)
            : searchParams.get(urlKey)) ?? fallbackValue)
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
  defaults: Partial<Values<KeyMap>>
) {
  return Object.fromEntries(
    Object.keys(state).map(key => [key, state[key] ?? defaults[key] ?? null])
  ) as Values<KeyMap>
}
