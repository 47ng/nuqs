import { useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * Like `useSyncExternalStore`, but for subscribing to multiple keys.
 *
 * Each key becomes the key of the returned object,
 * and the value is the result of calling `getKeySnapshot` with that key.
 *
 * @param keys - A list of keys to subscribe to.
 * @param subscribeKey - A function that takes a key and a callback,
 * subscribes to an external store using that key (calling the callback when
 * state changes occur), and returns a function to unsubscribe from that key.
 * @param getKeySnapshot - A function that takes a key and returns the snapshot for that key.
 * It will be called on the server and on the client, so it needs to handle both
 * environments.
 */
export function useSyncExternalStores<T>(
  keys: string[],
  subscribeKey: (key: string, callback: () => void) => () => void,
  getKeySnapshot: (key: string) => T
): Record<string, T> {
  const snapshot = useCallback((): [string, Record<string, T>] => {
    const record = Object.fromEntries(
      keys.map(key => [key, getKeySnapshot(key)])
    )
    const cacheKey = JSON.stringify(record)
    return [cacheKey, record]
  }, [keys.join(','), getKeySnapshot])
  const cacheRef = useRef<null | [string, Record<string, T>]>(null)
  // Initialize the cache with the initial snapshot
  if (cacheRef.current === null) {
    cacheRef.current = snapshot()
  }
  const subscribe = useCallback(
    (callback: () => void) => {
      const off = keys.map(key => subscribeKey(key, callback))
      return () => off.forEach(unsubscribe => unsubscribe())
    },
    [keys.join(','), subscribeKey]
  )
  return useSyncExternalStore<Record<string, T>>(
    subscribe,
    () => {
      const [cacheKey, record] = snapshot()
      if (cacheRef.current![0] === cacheKey) {
        return cacheRef.current![1]!
      }
      cacheRef.current = [cacheKey, record]
      return record
    },
    () => cacheRef.current![1]!
  )
}
