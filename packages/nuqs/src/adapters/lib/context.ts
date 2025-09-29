import {
  createContext,
  createElement,
  useContext,
  useRef,
  type Context,
  type ProviderProps,
  type ReactElement,
  type ReactNode
} from 'react'
import type { Options } from '../../defs'
import { debugEnabled } from '../../lib/debug'
import { error } from '../../lib/errors'
import type { AdapterInterface, UseAdapterHook } from './defs'

export type AdapterProps = {
  defaultOptions?: Partial<
    Pick<Options, 'shallow' | 'clearOnDefault' | 'scroll' | 'limitUrlUpdates'>
  >
  processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams
}

export type AdapterContext = AdapterProps & {
  useAdapter: UseAdapterHook
}

export const context: Context<AdapterContext> = createContext<AdapterContext>({
  useAdapter() {
    throw new Error(error(404))
  }
})
context.displayName = 'NuqsAdapterContext'

export type DefaultValueStore = Record<string, unknown>
const defaultValueContext = createContext<DefaultValueStore | null>(null)

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

export type AdapterProvider = (
  props: AdapterProps & {
    children: ReactNode
  }
) => ReactElement<ProviderProps<AdapterContext>>

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
  return function NuqsAdapterProvider({
    children,
    defaultOptions,
    processUrlSearchParams,
    ...props
  }) {
    const defaultValueStore = useRef({})
    return createElement(
      context.Provider,
      {
        ...props,
        value: { useAdapter, defaultOptions, processUrlSearchParams }
      },
      createElement(
        defaultValueContext.Provider,
        { value: defaultValueStore.current },
        children
      )
    )
  }
}

export function useDefaultValueStore(): DefaultValueStore {
  const context = useContext(defaultValueContext)
  if (!context) {
    throw new Error('[nuqs] No DefaultValueContext found')
  }
  return context
}

export function useAdapter(watchKeys: string[]): AdapterInterface {
  const value = useContext(context)
  if (!('useAdapter' in value)) {
    throw new Error(error(404))
  }
  return value.useAdapter(watchKeys)
}

export const useAdapterDefaultOptions = (): AdapterProps['defaultOptions'] =>
  useContext(context).defaultOptions

export const useAdapterProcessUrlSearchParams =
  (): AdapterProps['processUrlSearchParams'] =>
    useContext(context).processUrlSearchParams
