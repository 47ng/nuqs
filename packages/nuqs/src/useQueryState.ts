import { useRouter, useSearchParams } from 'next/navigation.js' // https://github.com/47ng/nuqs/discussions/352
import React from 'react'
import { debug } from './debug'
import type { Options } from './defs'
import type { Parser } from './parsers'
import { SYNC_EVENT_KEY, emitter } from './sync'
import {
  FLUSH_RATE_LIMIT_MS,
  enqueueQueryStringUpdate,
  getQueuedValue,
  scheduleFlushToURL
} from './update-queue'
import { safeParse } from './utils'

export interface UseQueryStateOptions<T> extends Parser<T>, Options {}

export type UseQueryStateReturn<Parsed, Default> = [
  Default extends undefined
    ? Parsed | null // value can't be null if default is specified
    : Parsed,
  <Shallow>(
    value:
      | null
      | Parsed
      | ((
          old: Default extends Parsed ? Parsed : Parsed | null
        ) => Parsed | null),
    options?: Options<Shallow>
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
 *     queryTypes.integer.defaultValue(0)
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
 * check out the `queryTypes` helpers:
 * ```ts
 *   const [date, setDate] = useQueryState(
 *     'date',
 *     queryTypes.isoDateTime.withDefault(new Date('2021-01-01'))
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
 * check out the `queryTypes` helpers:
 * ```ts
 *   const [date, setDate] = useQueryState(
 *     'date',
 *     queryTypes.isoDateTime.withDefault(new Date('2021-01-01'))
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
 *     queryTypes.integer.defaultValue(0)
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
 *     queryTypes.isoDateTime.withDefault(new Date('2021-01-01'))
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
    throttleMs = FLUSH_RATE_LIMIT_MS,
    parse = x => x as unknown as T,
    serialize = String,
    eq = (a, b) => a === b,
    defaultValue = undefined,
    clearOnDefault = false,
    startTransition
  }: Partial<UseQueryStateOptions<T>> & {
    defaultValue?: T
  } = {
    history: 'replace',
    scroll: false,
    shallow: true,
    throttleMs: FLUSH_RATE_LIMIT_MS,
    parse: x => x as unknown as T,
    serialize: String,
    eq: (a, b) => a === b,
    clearOnDefault: false,
    defaultValue: undefined
  }
) {
  const router = useRouter()
  // Not reactive, but available on the server and on page load
  const initialSearchParams = useSearchParams()
  const valueRef = React.useRef<string | null>(null)
  const [internalState, setInternalState] = React.useState<T | null>(() => {
    const queueValue = getQueuedValue(key)
    const urlValue = initialSearchParams?.get(key) ?? null
    const value = queueValue ?? urlValue
    valueRef.current = value
    return value === null ? null : safeParse(parse, value, key)
  })
  const stateRef = React.useRef(internalState)
  debug(
    '[nuqs `%s`] render - state: %O, iSP: %s',
    key,
    internalState,
    initialSearchParams?.get(key) ?? null
  )

  React.useEffect(() => {
    // This will be removed in v2 which will drop support for
    // partially-functional shallow routing (14.0.2 and 14.0.3)
    if (window.next?.version !== '14.0.3') {
      return
    }
    const value = initialSearchParams.get(key) ?? null
    if (value === valueRef.current) {
      return
    }
    const state = value === null ? null : safeParse(parse, value, key)
    debug('[nuqs `%s`] syncFromUseSearchParams %O', key, state)
    stateRef.current = state
    valueRef.current = value
    setInternalState(state)
  }, [initialSearchParams?.get(key), key])

  // Sync all hooks together & with external URL changes
  React.useInsertionEffect(() => {
    function updateInternalState(state: T | null) {
      debug('[nuqs `%s`] updateInternalState %O', key, state)
      stateRef.current = state
      valueRef.current = state === null ? null : serialize(state)
      setInternalState(state)
    }
    function syncFromURL(search: URLSearchParams) {
      const value = search.get(key) ?? null
      if (value === valueRef.current) {
        return
      }
      const state = value === null ? null : safeParse(parse, value, key)
      debug('[nuqs `%s`] syncFromURL %O', key, state)
      updateInternalState(state)
      valueRef.current = value
    }
    debug('[nuqs `%s`] subscribing to sync', key)
    emitter.on(SYNC_EVENT_KEY, syncFromURL)
    emitter.on(key, updateInternalState)
    return () => {
      debug('[nuqs `%s`] unsubscribing from sync', key)
      emitter.off(SYNC_EVENT_KEY, syncFromURL)
      emitter.off(key, updateInternalState)
    }
  }, [key])

  const update = React.useCallback(
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
      // Sync all hooks state (including this one)
      emitter.emit(key, newValue)
      valueRef.current = enqueueQueryStringUpdate(key, newValue, serialize, {
        // Call-level options take precedence over hook declaration options.
        history: options.history ?? history,
        shallow: options.shallow ?? shallow,
        scroll: options.scroll ?? scroll,
        throttleMs: options.throttleMs ?? throttleMs,
        startTransition: options.startTransition ?? startTransition
      })
      return scheduleFlushToURL(router)
    },
    [key, history, shallow, scroll, throttleMs, startTransition]
  )
  return [internalState ?? defaultValue ?? null, update]
}

function isUpdaterFunction<T>(
  stateUpdater: React.SetStateAction<T>
): stateUpdater is (prevState: T) => T {
  return typeof stateUpdater === 'function'
}
