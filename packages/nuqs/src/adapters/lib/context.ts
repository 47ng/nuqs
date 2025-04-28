import {
  createContext,
  createElement,
  useContext,
  type Context,
  type ProviderProps,
  type ReactElement,
  type ReactNode
} from 'react'
import { debugEnabled } from '../../debug'
import { error } from '../../errors'
import type { AdapterInterface, UseAdapterHook } from './defs'

export type AdapterContext = {
  useAdapter: UseAdapterHook
}

export const context: Context<AdapterContext> = createContext<AdapterContext>({
  useAdapter() {
    throw new Error(error(404))
  }
})
context.displayName = 'NuqsAdapterContext'

declare global {
  interface Window {
    __NuqsAdapterContext?: typeof context
  }
}

if (debugEnabled && typeof window !== 'undefined') {
  if (window.__NuqsAdapterContext && window.__NuqsAdapterContext !== context) {
    console.error(error(303))
  }
  window.__NuqsAdapterContext = context
}

export type AdapterProvider = ({
  children
}: {
  children: ReactNode
}) => ReactElement<ProviderProps<AdapterContext>>

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
): AdapterProvider {
  return ({ children, ...props }: { children: ReactNode }) =>
    createElement(
      context.Provider,
      { ...props, value: { useAdapter } },
      children
    )
}

export function useAdapter(): AdapterInterface {
  const value = useContext(context)
  if (!('useAdapter' in value)) {
    throw new Error(error(404))
  }
  return value.useAdapter()
}
