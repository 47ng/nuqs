import React from 'react'
import { useRouter } from 'next/router'
import { HistoryOptions, Serializers } from './defs'

export interface UseQueryStateOptions<T> extends Serializers<T> {
  /**
   * The operation to use on state updates. Defaults to `replace`.
   */
  history: HistoryOptions
}

export type UseQueryStateReturn<T> = [
  T | null,
  React.Dispatch<React.SetStateAction<T>>
]

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * @param key - The URL query string key to bind to
 */
export function useQueryState<T = string>(
  key: string,
  {
    history = 'replace',
    parse = x => (x as unknown) as T,
    serialize = x => `${x}`
  }: Partial<UseQueryStateOptions<T>> = {}
): UseQueryStateReturn<T | null> {
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
    return value ? parse(value) : null
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
      if (!newValue) {
        // Don't leave value-less keys hanging
        query.delete(key)
      } else {
        const serialized = serialize(newValue)
        if (serialized) {
          query.set(key, serialized)
        } else {
          // Serializers can return null to unset keys
          query.delete(key)
        }
      }

      // Remove fragment and query from asPath
      // router.pathname includes dynamic route keys, rather than the route itself,
      // e.g. /views/[view] rather than /views/my-view
      const [asPath] = router.asPath.split(/\?|#/, 1)
      updateUrl?.call(
        router,
        {
          pathname: router.pathname,
          hash: window.location.hash,
          search: query.toString()
        },
        {
          pathname: asPath,
          hash: window.location.hash,
          search: query.toString()
        }
      )
    },
    [key, updateUrl]
  )
  return [value, update]
}
