import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type Context,
  type ProviderProps,
  type ReactElement,
  type ReactNode
} from 'react'
import type { Options } from '../../defs'
import { error303, error404 } from '../../lib/errors'
import { globalWeakSingleton } from '../../lib/global-singleton'
import type { UseAdapterHook } from './defs'

export type AdapterProps = {
  defaultOptions?: Partial<
    Pick<
      Options,
      'history' | 'shallow' | 'clearOnDefault' | 'scroll' | 'limitUrlUpdates'
    >
  >
  processUrlSearchParams?: (search: URLSearchParams) => URLSearchParams
}

export type AdapterContext = AdapterProps & {
  useAdapter: UseAdapterHook
}

// Keyed by createContext identity: copies sharing one React instance share
// the context, while distinct React instances keep isolated contexts.
// Revisit in nuqs@3 (react@^19 only): the React 18/19 Provider shape hazard
// goes away, but distinct React instances on one page would then share one
// context object (concurrent renders interleave its _currentValue).
export const context: Context<AdapterContext> = globalWeakSingleton(
  'adapter-context',
  createContext,
  () => {
    const ctx = createContext<AdapterContext>({
      useAdapter() {
        throw new Error(error404)
      }
    })
    ctx.displayName = 'NuqsAdapterContext'
    return ctx
  }
)

declare global {
  interface Window {
    __NuqsAdapterContext?: typeof context
  }
}

// Detect adapter contexts that cannot be shared across duplicate copies:
// nuqs version mismatch, or multiple React instances. Same-version copies
// on one React share a single context via globalWeakSingleton above.
if (typeof window !== 'undefined') {
  if (window.__NuqsAdapterContext && window.__NuqsAdapterContext !== context) {
    console.error(error303)
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
  return ({ children, defaultOptions, processUrlSearchParams, ...props }) => {
    // Stable context value: under React 19's lazy context propagation, a
    // fresh value on every provider render invalidates all consumers, even
    // through a nested provider of the same context that should shadow them.
    const value = useMemo(
      () => ({ useAdapter, defaultOptions, processUrlSearchParams }),
      [defaultOptions, processUrlSearchParams]
    )
    return createElement(context.Provider, { ...props, value }, children)
  }
}

export function useAdapterContext(): AdapterContext {
  const value = useContext(context)
  if (!('useAdapter' in value)) {
    throw new Error(error404)
  }
  return value
}
