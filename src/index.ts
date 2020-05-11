import React from 'react'
import { useRouter } from 'next/router'

export interface UseQueryStateOptions {
  /**
   * The operation to use on state updates. Defaults to `replace`.
   */
  history: 'replace' | 'push'
}

export type UseQueryStateReturn<T> = [
  T,
  React.Dispatch<React.SetStateAction<T>>
]

/**
 * React state hook synchronized with a URL query string in Next.js
 *
 * @param key - The URL query string key to bind to
 */
export function useQueryState(
  key: string,
  { history = 'replace' }: Partial<UseQueryStateOptions> = {}
): UseQueryStateReturn<string | null> {
  const router = useRouter()

  // Memoizing the update function has the advantage of making it
  // immutable as long as `history` stays the same.
  // It reduces the amount of reactivity needed to update the state.
  const updateUrl = React.useMemo(
    () => (history === 'push' ? router.push : router.replace),
    [history]
  )

  const getValue = React.useCallback((): string | null => {
    if (typeof window === 'undefined') {
      // Not available in an SSR context
      return null
    }
    const query = new URLSearchParams(window.location.search)
    return query.get(key)
  }, [])

  // Update the state value only when the relevant key changes.
  // Because we're not calling getValue in the function argument
  // of React.useMemo, but instead using it as the function to call,
  // there is no need to pass it in the dependency array.
  const value = React.useMemo(getValue, [router.query[key]])

  const update = React.useCallback(
    (stateUpdater: React.SetStateAction<string | null>) => {
      // Resolve the new value based on old value & updater
      const oldValue = getValue()
      const newValue =
        typeof stateUpdater === 'function'
          ? stateUpdater(oldValue)
          : stateUpdater
      // We can't rely on router.query here to avoid causing
      // unnecessary renders when other query parameters change.
      // URLSearchParams is already polyfilled by Next.js
      const query = new URLSearchParams(window.location.search)
      if (newValue) {
        query.set(key, newValue)
      } else {
        // Don't leave value-less keys hanging
        query.delete(key)
      }
      updateUrl?.call(router, {
        pathname: router.pathname,
        hash: window.location.hash,
        search: query.toString()
      })
    },
    [key, updateUrl]
  )
  return [value, update]
}
