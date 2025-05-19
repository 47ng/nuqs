import { useAdapter } from './adapters/lib/context'
import {
  useQueryStatesCore,
  type CoreValues,
  type UseQueryStatesCoreKeysMap,
  type UseQueryStatesCoreOptions,
  type UseQueryStatesCoreReturn,
  type SetCoreValues
} from './core/useQueryStatesCore'

export type UseQueryStatesKeysMap<Map = any> = UseQueryStatesCoreKeysMap<Map>
export type UseQueryStatesOptions<KeyMap extends UseQueryStatesKeysMap> =
  UseQueryStatesCoreOptions<KeyMap>

export type Values<T extends UseQueryStatesKeysMap> = CoreValues<T>
export type SetValues<T extends UseQueryStatesKeysMap> = SetCoreValues<T>

export type UseQueryStatesReturn<T extends UseQueryStatesKeysMap> =
  UseQueryStatesCoreReturn<T>

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
  const adapter = useAdapter()
  return useQueryStatesCore(keyMap, adapter, options)
}
