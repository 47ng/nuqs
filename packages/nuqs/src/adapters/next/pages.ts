import {
  createElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode
} from 'react'
import {
  context,
  createAdapterProvider,
  type AdapterContext,
  type AdapterProps
} from '../lib/context'
import {
  createBridgeStore,
  PagesBridge,
  useNuqsNextPagesRouterIsolatedAdapter,
  useWarnOnFlagToggle
} from './impl.isolated'
import { NavigationSpy, useNuqsNextPagesRouterAdapter } from './impl.pages'

const Provider = createAdapterProvider(useNuqsNextPagesRouterAdapter)

export function NuqsAdapter({
  children,
  experimental_keyIsolation,
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
  /**
   * Experimental: opt into per-key isolation — writing a search param only
   * re-renders the hooks watching that key, instead of every nuqs hook.
   *
   * Caveats:
   * - Must not be toggled at runtime (latched on first render).
   * - The pages router re-renders the whole page tree on every route state
   *   change, so isolation only takes effect below a render-stable element:
   *   hoist the flagged `<NuqsAdapter>` subtree to module scope (or wrap it
   *   in `React.memo`) so React can bail out of re-rendering it.
   * - `defaultOptions` / `processUrlSearchParams` should be referentially
   *   stable to preserve the isolation benefit.
   */
  experimental_keyIsolation?: boolean
}): ReactElement {
  const [keyIsolation] = useState(() => experimental_keyIsolation ?? false)
  useWarnOnFlagToggle(keyIsolation, experimental_keyIsolation)
  if (keyIsolation) {
    return createElement(IsolatedPagesProvider, { ...adapterProps, children })
  }
  return createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(NavigationSpy, { key: 'nuqs-adapter-navigation-spy' }),
      children
    ]
  })
}

function IsolatedPagesProvider({
  children,
  defaultOptions,
  processUrlSearchParams
}: AdapterProps & {
  children: ReactNode
}): ReactElement {
  const [store] = useState(createBridgeStore)
  const value = useMemo<AdapterContext>(
    () => ({
      useAdapter: (watchKeys: string[]) =>
        useNuqsNextPagesRouterIsolatedAdapter(store, watchKeys),
      defaultOptions,
      processUrlSearchParams
    }),
    [store, defaultOptions, processUrlSearchParams]
  )
  // No Suspense: pages router hydration is single-pass and in tree order,
  // so the Bridge's render-phase seed always precedes the hooks' first reads.
  return createElement(context.Provider, { value }, [
    createElement(PagesBridge, { key: 'nuqs-adapter-pages-bridge', store }),
    children
  ])
}
