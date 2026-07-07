import {
  createElement,
  Suspense,
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
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'
import {
  AppBridge,
  createBridgeStore,
  useNuqsNextAppRouterIsolatedAdapter,
  useWarnOnFlagToggle
} from './impl.isolated'

const Provider = createAdapterProvider(useNuqsNextAppRouterAdapter)

export function NuqsAdapter({
  children,
  experimental_keyIsolation,
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
  /**
   * Experimental: opt into per-key isolation — writing a search param only
   * re-renders the hooks watching that key, instead of every nuqs hook
   * (Next.js' useSearchParams re-renders all its call sites on any change).
   *
   * Caveats:
   * - Must not be toggled at runtime (latched on first render).
   * - `defaultOptions` / `processUrlSearchParams` should be referentially
   *   stable to preserve the isolation benefit.
   */
  experimental_keyIsolation?: boolean
}): ReactElement {
  const [keyIsolation] = useState(() => experimental_keyIsolation ?? false)
  useWarnOnFlagToggle(keyIsolation, experimental_keyIsolation)
  if (keyIsolation) {
    return createElement(IsolatedAppProvider, { ...adapterProps, children })
  }
  return createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(Suspense, {
        key: 'nuqs-adapter-suspense-navspy',
        children: createElement(NavigationSpy)
      }),
      children
    ]
  })
}

function IsolatedAppProvider({
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
        useNuqsNextAppRouterIsolatedAdapter(store, watchKeys),
      defaultOptions,
      processUrlSearchParams
    }),
    [store, defaultOptions, processUrlSearchParams]
  )
  return createElement(context.Provider, { value }, [
    createElement(Suspense, {
      key: 'nuqs-adapter-suspense-navspy',
      children: createElement(NavigationSpy)
    }),
    // The Bridge precedes children in tree order, so its commits publish
    // before sibling subtrees process theirs.
    createElement(Suspense, {
      key: 'nuqs-adapter-suspense-bridge',
      children: createElement(AppBridge, { store })
    }),
    children
  ])
}
