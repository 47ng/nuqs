import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdapter } from './adapters/lib/context'
import type { Options } from './defs'
import { debug } from './lib/debug'
import { debounceController } from './lib/queues/debounce'
import {
  defaultRateLimit,
  globalThrottleQueue,
  type UpdateQueuePushArgs
} from './lib/queues/throttle'
import { safeParse } from './lib/safe-parse'
import { emitter, type CrossHookSyncPayload } from './lib/sync'
import type { Parser } from './parsers'

export interface UseQueryStateOptions<T> extends Parser<T>, Options {}

export type UseQueryStateReturn<Parsed, Default> = [
  Default extends undefined
    ? Parsed | null // value can't be null if default is specified
    : Parsed,
  (
    value:
      | null
      | Parsed
      | ((
          old: Default extends Parsed ? Parsed : Parsed | null
        ) => Parsed | null),
    options?: Options
  ) => Promise<URLSearchParams>
]

// Overload type signatures ----------------------------------------------------
// Note: the order of declaration matters (from the most specific to the least).

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * This variant is used when providing a default value. This will make
 * the returned state non-nullable when the query is not present in the URL.
 * (the default value will be returned instead).
 *
 * _Note: the URL will **not** be updated with the default value if the query
 * is missing._
 *
 * Setting the value to `null` will clear the query in the URL, and return
 * the default value as state.
 *
 * Example usage:
 * ```ts
 *   const [count, setCount] = useQueryState(
 *     'count',
 *     parseAsInteger.defaultValue(0)
 *   )
 *
 *   const increment = () => setCount(oldCount => oldCount + 1)
 *   const decrement = () => setCount(oldCount => oldCount - 1)
 *   // Clears the query key from the URL and `count` equals 0
 *   const clearCountQuery = () => setCount(null)
 * ```
 * @param key The URL query string key to bind to
 * @param options - Parser (defines the state data type), default value and optional history mode.
 */
export function useQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T> & { defaultValue: T }
): UseQueryStateReturn<
  NonNullable<ReturnType<typeof options.parse>>,
  typeof options.defaultValue
>

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * If the query is missing in the URL, the state will be `null`.
 *
 * Example usage:
 * ```ts
 *   // Blog posts filtering by tag
 *   const [tag, selectTag] = useQueryState('tag')
 *   const filteredPosts = posts.filter(post => tag ? post.tag === tag : true)
 *   const clearTag = () => selectTag(null)
 * ```
 * @param key The URL query string key to bind to
 * @param options - Parser (defines the state data type), and optional history mode.
 */
export function useQueryState<T>(
  key: string,
  options: UseQueryStateOptions<T>
): UseQueryStateReturn<NonNullable<ReturnType<typeof options.parse>>, undefined>

/**
 * Default type string, limited options & default value
 */
export function useQueryState(
  key: string,
  options: Options & {
    defaultValue: string
  }
): UseQueryStateReturn<string, typeof options.defaultValue>

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * If the query is missing in the URL, the state will be `null`.
 *
 * Note: by default the state type is a `string`. To use different types,
 * check out the `parseAsXYZ` helpers:
 * ```ts
 *   const [date, setDate] = useQueryState(
 *     'date',
 *     parseAsIsoDateTime.withDefault(new Date('2021-01-01'))
 *   )
 *
 *   const setToNow = () => setDate(new Date())
 *   const addOneHour = () => {
 *     setDate(oldDate => new Date(oldDate.valueOf() + 3600_000))
 *   }
 * ```
 * @param key The URL query string key to bind to
 * @param options - Parser (defines the state data type), and optional history mode.
 */
export function useQueryState(
  key: string,
  options: Pick<UseQueryStateOptions<string>, keyof Options>
): UseQueryStateReturn<string, undefined>

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * If the query is missing in the URL, the state will be `null`.
 *
 * Note: by default the state type is a `string`. To use different types,
 * check out the `parseAsXYZ` helpers:
 * ```ts
 *   const [date, setDate] = useQueryState(
 *     'date',
 *     parseAsIsoDateTime.withDefault(new Date('2021-01-01'))
 *   )
 *
 *   const setToNow = () => setDate(new Date())
 *   const addOneHour = () => {
 *     setDate(oldDate => new Date(oldDate.valueOf() + 3600_000))
 *   }
 * ```
 * @param key The URL query string key to bind to
 */
export function useQueryState(
  key: string
): UseQueryStateReturn<string, undefined>

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * If used without a `defaultValue` supplied in the options, and the query is
 * missing in the URL, the state will be `null`.
 *
 * ### Behaviour with default values:
 *
 * _Note: the URL will **not** be updated with the default value if the query
 * is missing._
 *
 * Setting the value to `null` will clear the query in the URL, and return
 * the default value as state.
 *
 * Example usage:
 * ```ts
 *   // Blog posts filtering by tag
 *   const [tag, selectTag] = useQueryState('tag')
 *   const filteredPosts = posts.filter(post => tag ? post.tag === tag : true)
 *   const clearTag = () => selectTag(null)
 *
 *   // With default values
 *
 *   const [count, setCount] = useQueryState(
 *     'count',
 *     parseAsInteger.defaultValue(0)
 *   )
 *
 *   const increment = () => setCount(oldCount => oldCount + 1)
 *   const decrement = () => setCount(oldCount => oldCount - 1)
 *   const clearCountQuery = () => setCount(null)
 *
 *   // --
 *
 *   const [date, setDate] = useQueryState(
 *     'date',
 *     parseAsIsoDateTime.withDefault(new Date('2021-01-01'))
 *   )
 *
 *   const setToNow = () => setDate(new Date())
 *   const addOneHour = () => {
 *     setDate(oldDate => new Date(oldDate.valueOf() + 3600_000))
 *   }
 * ```
 * @param key The URL query string key to bind to
 * @param options - Parser (defines the state data type), optional default value and history mode.
 */
export function useQueryState<T = string>(
  key: string,
  {
    history = 'replace',
    shallow = true,
    scroll = false,
    throttleMs = defaultRateLimit.timeMs,
    limitUrlUpdates,
    parse = x => x as unknown as T,
    serialize = String,
    eq = (a, b) => a === b,
    defaultValue = undefined,
    clearOnDefault = true,
    startTransition
  }: Partial<UseQueryStateOptions<T>> & {
    defaultValue?: T
  } = {
    history: 'replace',
    scroll: false,
    shallow: true,
    throttleMs: defaultRateLimit.timeMs,
    parse: x => x as unknown as T,
    serialize: String,
    eq: (a, b) => a === b,
    clearOnDefault: true,
    defaultValue: undefined
  }
) {
  const adapter = useAdapter()
  const initialSearchParams = adapter.searchParams
  const queryRef = useRef<string | null>(initialSearchParams?.get(key) ?? null)
  const [internalState, setInternalState] = useState<T | null>(() => {
    const queuedQuery = debounceController.getQueuedQuery(key)
    const query =
      queuedQuery === undefined
        ? (initialSearchParams?.get(key) ?? null)
        : queuedQuery
    return query === null ? null : safeParse(parse, query, key)
  })
  const stateRef = useRef(internalState)
  debug(
    '[nuqs `%s`] render - state: %O, iSP: %s',
    key,
    internalState,
    initialSearchParams?.get(key) ?? null
  )

  useEffect(() => {
    const query = initialSearchParams?.get(key) ?? null
    if (query === queryRef.current) {
      return
    }
    const state = query === null ? null : safeParse(parse, query, key)
    debug('[nuqs `%s`] syncFromUseSearchParams %O', key, state)
    stateRef.current = state
    queryRef.current = query
    setInternalState(state)
  }, [initialSearchParams?.get(key), key])

  // Sync all hooks together & with external URL changes
  useEffect(() => {
    function updateInternalState({ state, query }: CrossHookSyncPayload) {
      debug('[nuqs `%s`] updateInternalState %O', key, state)
      stateRef.current = state
      queryRef.current = query
      setInternalState(state)
    }
    debug('[nuqs `%s`] subscribing to sync', key)
    emitter.on(key, updateInternalState)
    return () => {
      debug('[nuqs `%s`] unsubscribing from sync', key)
      emitter.off(key, updateInternalState)
    }
  }, [key])

  const update = useCallback(
    (stateUpdater: React.SetStateAction<T | null>, options: Options = {}) => {
      let newValue: T | null = isUpdaterFunction(stateUpdater)
        ? stateUpdater(stateRef.current ?? defaultValue ?? null)
        : stateUpdater
      if (
        (options.clearOnDefault ?? clearOnDefault) &&
        newValue !== null &&
        defaultValue !== undefined &&
        eq(newValue, defaultValue)
      ) {
        newValue = null
      }
      const query = newValue === null ? null : serialize(newValue)
      // Sync all hooks state (including this one)
      emitter.emit(key, { state: newValue, query })
      const update: UpdateQueuePushArgs = {
        key,
        query,
        options: {
          history: options.history ?? history,
          shallow: options.shallow ?? shallow,
          scroll: options.scroll ?? scroll,
          startTransition: options.startTransition ?? startTransition
        }
      }
      if (
        options.limitUrlUpdates?.method === 'debounce' ||
        limitUrlUpdates?.method === 'debounce'
      ) {
        const timeMs =
          options.limitUrlUpdates?.timeMs ??
          limitUrlUpdates?.timeMs ??
          defaultRateLimit.timeMs
        return debounceController.push(update, timeMs, adapter)
      } else {
        update.throttleMs =
          options.limitUrlUpdates?.timeMs ??
          limitUrlUpdates?.timeMs ??
          options.throttleMs ??
          throttleMs
        globalThrottleQueue.push(update)
        return globalThrottleQueue.flush(adapter)
      }
    },
    [
      key,
      history,
      shallow,
      scroll,
      throttleMs,
      limitUrlUpdates?.method,
      limitUrlUpdates?.timeMs,
      startTransition,
      adapter.updateUrl,
      adapter.getSearchParamsSnapshot,
      adapter.rateLimitFactor
    ]
  )
  return [internalState ?? defaultValue ?? null, update]
}

function isUpdaterFunction<T>(
  stateUpdater: React.SetStateAction<T>
): stateUpdater is (prevState: T) => T {
  return typeof stateUpdater === 'function'
}
