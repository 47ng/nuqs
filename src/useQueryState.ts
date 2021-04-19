import { useRouter } from 'next/router'
import React from 'react'
import { HistoryOptions, Serializers } from './defs'

export interface UseQueryStateOptions<T> extends Serializers<T> {
  /**
   * The operation to use on state updates. Defaults to `replace`.
   */
  history: HistoryOptions
  defaultValue: T
}

export type UseQueryStateReturn<T> = [
  T,
  React.Dispatch<React.SetStateAction<T>>
]

export type UseQueryStateOptionsWithDefault<T> = Pick<
  UseQueryStateOptions<T>,
  'parse' | 'serialize' | 'defaultValue'
> &
  Partial<Omit<UseQueryStateOptions<T>, 'parse' | 'serialize' | 'defaultValue'>>

// Overload type signatures ----------------------------------------------------

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * This variant is used when a `defaultValue` is supplied in the options.
 *
 * _Note: the URL will **not** be updated with the default value if the query
 * is missing._
 *
 * Setting the value to `null` will clear the query in the URL, and return
 * the default value as state.
 *
 * Example usage:
 * ```ts
 *   const [count, setCount] = useQueryState('count', {
 *    ...queryTypes.integer,
 *    defaultValue: 0
 *   })
 *
 *   const increment = () => setCount(oldCount => oldCount + 1)
 *   const decrement = () => setCount(oldCount => oldCount - 1)
 *   const clearCountQuery = () => setCount(null)
 *
 *   // --
 *
 *   const [date, setDate] = useQueryState('date', {
 *     ...queryTypes.isoDateTime,
 *     default: new Date('2021-01-01')
 *   })
 *
 *   const setToNow = () => setDate(new Date())
 *   const addOneHour = () => {
 *     setDate(oldDate => new Date(oldDate.valueOf() + 3600_000))
 *   }
 * ```
 *
 * @param key - The URL query string key to bind to
 * @param options - Serializers (define the state data type), default value and optional history mode.
 */
export function useQueryState<T = string>(
  key: string,
  options: UseQueryStateOptionsWithDefault<T>
): UseQueryStateReturn<T>

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * This variant is used without a `defaultValue` supplied in the options. If
 * the query is missing in the URL, the state will be `null`.
 *
 * Example usage:
 * ```ts
 *   // Blog posts filtering by tag
 *   const [tag, selectTag] = useQueryState('tag')
 *   const filteredPosts = posts.filter(post => tag ? post.tag === tag : true)
 *   const clearTag = () => selectTag(null)
 * ```
 *
 * @param key - The URL query string key to bind to
 * @param options - Serializers (define the state data type), optional history mode.
 */
export function useQueryState<T = string>(
  key: string,
  options?: Partial<UseQueryStateOptions<T>>
): UseQueryStateReturn<T | null>

// Implementation --------------------------------------------------------------

export function useQueryState<T = string>(
  key: string,
  {
    history = 'replace',
    parse = x => (x as unknown) as T,
    serialize = x => `${x}`,
    defaultValue
  }: Partial<UseQueryStateOptions<T>> = {}
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
    (stateUpdater: React.SetStateAction<T | null>) => {
      const isUpdaterFunction = (
        input: any
      ): input is (prevState: T | null) => T | null => {
        return typeof input === 'function'
      }

      // Resolve the new value based on old value & updater
      const oldValue = getValue()
      const newValue = isUpdaterFunction(stateUpdater)
        ? stateUpdater(oldValue)
        : stateUpdater
      // We can't rely on router.query here to avoid causing
      // unnecessary renders when other query parameters change.
      // URLSearchParams is already polyfilled by Next.js
      const query = new URLSearchParams(window.location.search)
      if (newValue === null || newValue === undefined) {
        // Don't leave value-less keys hanging
        query.delete(key)
      } else {
        query.set(key, serialize(newValue))
      }

      // Remove fragment and query from asPath
      // router.pathname includes dynamic route keys, rather than the route itself,
      // e.g. /views/[view] rather than /views/my-view
      const [asPath] = router.asPath.split(/\?|#/, 1)
      const search = query.toString()
      const hash = window.location.hash
      updateUrl?.call(
        router,
        {
          pathname: router.pathname,
          hash,
          search
        },
        {
          pathname: asPath,
          hash,
          search
        }
      )
    },
    [key, updateUrl]
  )
  return [value ?? defaultValue ?? null, update]
}
