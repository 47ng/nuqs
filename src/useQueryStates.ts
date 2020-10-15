import React from 'react'
import { useRouter } from 'next/router'
import { HistoryOptions, Serializers } from './defs'

export type UseQueryStatesKeysMap<T> = {
  [K in keyof T]: Serializers<T[K]>
}

export interface UseQueryStatesOptions {
  /**
   * The operation to use on state updates. Defaults to `replace`.
   */
  history: HistoryOptions
}

export type Values<T> = {
  [K in keyof T]: T[K] | null
}

export type SetValues<T> = React.Dispatch<
  React.SetStateAction<Partial<Values<T>>>
>

export type UseQueryStatesReturn<T> = [Values<T>, SetValues<T>]

/**
 * Synchronise multiple query string arguments to React state in Next.js
 *
 * @param keys - An object describing the keys to synchronise and how to
 *               serialise and parse them.
 *               Use `queryTypes.(string|integer|float)` for quick shorthands.
 */
export function useQueryStates<T extends object>(
  keys: UseQueryStatesKeysMap<T>,
  { history = 'replace' }: Partial<UseQueryStatesOptions> = {}
): UseQueryStatesReturn<T> {
  const router = useRouter()

  // Memoizing the update function has the advantage of making it
  // immutable as long as `history` stays the same.
  // It reduces the amount of reactivity needed to update the state.
  const updateUrl = React.useMemo(
    () => (history === 'push' ? router.push : router.replace),
    [history]
  )

  const getValues = React.useCallback((): Values<T> => {
    if (typeof window === 'undefined') {
      // Not available in an SSR context, return all null
      return Object.keys(keys).reduce(
        (obj, key) => ({ ...obj, [key]: null }),
        {} as Values<T>
      )
    }
    const query = new URLSearchParams(window.location.search)
    return Object.keys(keys).reduce((values, key) => {
      const { parse } = keys[key as keyof T]
      const value = query.get(key)
      return {
        ...values,
        [key]: value ? parse(value) : null
      }
    }, {} as Values<T>)
  }, [keys])

  // Update the state values only when the relevant keys change.
  // Because we're not calling getValues in the function argument
  // of React.useMemo, but instead using it as the function to call,
  // there is no need to pass it in the dependency array.
  const values = React.useMemo(
    getValues,
    Object.keys(keys).map(key => router.query[key])
  )

  const update = React.useCallback(
    (stateUpdater: React.SetStateAction<Partial<Values<T>>>) => {
      const isUpdaterFunction = (
        input: any
      ): input is (prevState: Partial<Values<T>>) => Partial<Values<T>> => {
        return typeof input === 'function'
      }

      // Resolve the new values based on old values & updater
      const oldValues = getValues()
      const newValues = isUpdaterFunction(stateUpdater)
        ? stateUpdater(oldValues)
        : stateUpdater
      // We can't rely on router.query here to avoid causing
      // unnecessary renders when other query parameters change.
      // URLSearchParams is already polyfilled by Next.js
      const query = new URLSearchParams(window.location.search)

      Object.keys(newValues).forEach(key => {
        const newValue = newValues[key as keyof T]
        if (newValue === null) {
          query.delete(key)
        } else if (newValue !== undefined) {
          const { serialize } = keys[key as keyof T]
          query.set(key, serialize(newValue as T[keyof T]))
        }
      })

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
    [keys, updateUrl]
  )
  return [values, update]
}
