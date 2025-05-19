import {
  createElement,
  useMemo,
  type ReactNode
} from 'react'
import { createAdapterProvider } from './context'
import { map } from 'nanostores'
import { useStore } from '@nanostores/react'
import { generateUpdateUrlFn, useReactSearchParams } from '../lib/react'

const $NuqsReactAdapter = map({
  fullPageNavigationOnShallowFalseUpdates: false
})

function useNuqsReactAdapter() {
  const { fullPageNavigationOnShallowFalseUpdates } = useStore(
    $NuqsReactAdapter
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

const NuqsAstroReactAdapter = createAdapterProvider(useNuqsReactAdapter)

export function NuqsAdapter({
  children,
  fullPageNavigationOnShallowFalseUpdates = false
}: {
  children: ReactNode
  fullPageNavigationOnShallowFalseUpdates?: boolean
}) {

  $NuqsReactAdapter.set({ fullPageNavigationOnShallowFalseUpdates })

  return createElement(NuqsAstroReactAdapter, undefined, children)
}
