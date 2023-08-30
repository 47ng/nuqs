import { useRouter } from 'next/router'
import React from 'react'
import type { HistoryOptions, Serializers } from '../commonDefs'
import type { TransitionOptions } from './defs'

export interface UseQueryStateOptions<T> extends Serializers<T> {
  /**
   * The operation to use on state updates. Defaults to `replace`.
   */
  history?: HistoryOptions
}

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
    transitionOptions?: TransitionOptions
  ) => Promise<boolean>
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
 *   const clearCountQuery = () => setCount(null)
 * ```
 * @param key The URL query string key to bind to
 * @param options - Serializers (defines the state data type), default value and optional history mode.
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
 * @param options - Serializers (defines the state data type), and optional history mode.
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
  options: {
    history?: HistoryOptions
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
 * @param options - Serializers (defines the state data type), and optional history mode.
 */
export function useQueryState(
  key: string,
  options: Pick<UseQueryStateOptions<string>, 'history'>
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
 * @param options - Serializers (defines the state data type), optional default value and history mode.
 */
export function useQueryState<T = string>(
  key: string,
  {
    history = 'replace',
    parse = x => x as unknown as T,
    serialize = String,
    defaultValue = undefined
  }: Partial<UseQueryStateOptions<T>> & { defaultValue?: T } = {
    history: 'replace',
    parse: x => x as unknown as T,
    serialize: String,
    defaultValue: undefined
  }
) {
  const router = useRouter()

  // Memoizing the update function has the advantage of making it
  // immutable as long as `history` stays the same.
  // It reduces the amount of reactivity needed to update the state.
  const updateUrl = React.useMemo(
    () => (history === 'push' ? router.push : router.replace),
    [history]
  )

  const getValue = React.useCallback((): T | null => {
    if (typeof window === 'undefined') {
      // Not available in an SSR context
      return null
    }
    const query = new URLSearchParams(window.location.search)
    const value = query.get(key)
    return value !== null ? parse(value) : null
  }, [])

  // Update the state value only when the relevant key changes.
  // Because we're not calling getValue in the function argument
  // of React.useMemo, but instead using it as the function to call,
  // there is no need to pass it in the dependency array.
  const value = React.useMemo(getValue, [router.query[key]])

  const update = React.useCallback(
    (
      stateUpdater: React.SetStateAction<T | null>, // todo: This is wrong now
      transitionOptions?: TransitionOptions
    ) => {
      const isUpdaterFunction = (
        input: any
      ): input is (prevState: T | null) => T | null => {
        return typeof input === 'function'
      }

      // Resolve the new value based on old value & updater
      const oldValue = getValue() ?? defaultValue ?? null
      const newValue = isUpdaterFunction(stateUpdater)
        ? stateUpdater(oldValue)
        : stateUpdater
      // We can't rely on router.query here to avoid causing
      // unnecessary renders when other query parameters change.
      // URLSearchParams is already polyfilled by Next.js
      const query = new URLSearchParams(window.location.search)
      if (newValue === null) {
        // Don't leave value-less keys hanging
        query.delete(key)
      } else {
        query.set(key, serialize(newValue))
      }
      const search = query.toString()
      const hash = window.location.hash
      return updateUrl?.call(
        router,
        {
          pathname: router.pathname,
          hash,
          search
        },
        {
          pathname: window.location.pathname,
          hash,
          search
        },
        transitionOptions
      )
    },
    [key, updateUrl]
  )
  return [value ?? defaultValue ?? null, update]
}
