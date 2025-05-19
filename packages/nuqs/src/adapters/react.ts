import mitt from 'mitt'
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode
} from 'react'
import { createAdapterProvider } from './lib/context'
import { generateUpdateUrlFn, useReactSearchParams } from './lib/react'

const NuqsReactAdapterContext = createContext({
  fullPageNavigationOnShallowFalseUpdates: false
})

function useNuqsReactAdapter() {
  const { fullPageNavigationOnShallowFalseUpdates } = useContext(
    NuqsReactAdapterContext
  )
  const searchParams = useReactSearchParams()
  const updateUrl = useMemo(
    () => generateUpdateUrlFn(fullPageNavigationOnShallowFalseUpdates),
    [fullPageNavigationOnShallowFalseUpdates]
  )
  return {
    searchParams,
    updateUrl
  }
}

const NuqsReactAdapter = createAdapterProvider(useNuqsReactAdapter)

export function NuqsAdapter({
  children,
  fullPageNavigationOnShallowFalseUpdates = false
}: {
  children: ReactNode
  fullPageNavigationOnShallowFalseUpdates?: boolean
}) {
  return createElement(
    NuqsReactAdapterContext.Provider,
    { value: { fullPageNavigationOnShallowFalseUpdates } },
    createElement(NuqsReactAdapter, null, children)
  )
}

/**
 * Opt-in to syncing shallow updates of the URL with the useOptimisticSearchParams hook.
 *
 * By default, the useOptimisticSearchParams hook will only react to internal nuqs updates.
 * If third party code updates the History API directly, use this function to
 * enable useOptimisticSearchParams to react to those changes.
 */
export { enableHistorySync } from './lib/react'
