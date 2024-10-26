import {
  createContext,
  createElement,
  useContext,
  type FC,
  type ReactNode
} from 'react'
import { error } from '../errors'
import type { UseAdapterHook } from './defs'

export type AdapterContext = {
  useAdapter: UseAdapterHook
}

export const context = createContext<AdapterContext>({
  useAdapter() {
    throw new Error(error(404))
  }
})
context.displayName = 'NuqsAdapterContext'

/**
 * Create a custom adapter (context provider) for nuqs to work with your framework / router.
 *
 * Adapters are based on React Context,
 *
 * @param useAdapter
 * @returns
 */
export function createAdapterProvider(
  useAdapter: UseAdapterHook
): FC<{ children: ReactNode }> {
  return ({ children, ...props }: { children: ReactNode }) =>
    createElement(
      context.Provider,
      { ...props, value: { useAdapter } },
      children
    )
}

export function useAdapter() {
  const value = useContext(context)
  if (!('useAdapter' in value)) {
    throw new Error(error(404))
  }
  return value.useAdapter()
}
