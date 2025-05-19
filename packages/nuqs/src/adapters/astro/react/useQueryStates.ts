import { useAdapter } from '../context'
import { useQueryStatesCore, type UseQueryStatesCoreKeysMap, type UseQueryStatesCoreOptions, type UseQueryStatesCoreReturn } from '../../../core/useQueryStatesCore'

/**
 * Synchronise multiple query string arguments to React state in Next.js
 *
 * @param keys - An object describing the keys to synchronise and how to
 *               serialise and parse them.
 *               Use `parseAs(String|Integer|Float|...)` for quick shorthands.
 * @param options - Optional history mode, shallow routing and scroll restoration options.
 */
export function useQueryStates<KeyMap extends UseQueryStatesCoreKeysMap>(
  keyMap: KeyMap,
  options: Partial<UseQueryStatesCoreOptions<KeyMap>> = {}
): UseQueryStatesCoreReturn<KeyMap> {
  const adapter = useAdapter()
  return useQueryStatesCore(keyMap, adapter, options)
}
