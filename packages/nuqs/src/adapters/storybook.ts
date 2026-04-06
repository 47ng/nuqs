import { useSearchParams } from 'next/navigation.js'
import {
  createElement,
  useCallback,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from 'react'
import { debug } from '../lib/debug'
import { resetQueues } from '../lib/queues/reset'
import { renderQueryString } from './custom'
import { context, type AdapterProps } from './lib/context'
import type { AdapterInterface } from './lib/defs'
import type { OnUrlUpdateFunction } from './testing'

export type { UrlUpdateEvent, OnUrlUpdateFunction } from './testing'

type StorybookAdapterProps = Pick<
  AdapterInterface,
  'autoResetQueueOnUpdate'
> & {
  /**
   * A function that will be called whenever the URL is updated.
   * Connect that to a Storybook action to see URL updates in the actions panel.
   */
  onUrlUpdate?: OnUrlUpdateFunction

  /**
   * Internal: enable throttling.
   *
   * @default 0 (no throttling)
   */
  rateLimitFactor?: number

  children: ReactNode
} & AdapterProps

export function NuqsStorybookAdapter({
  autoResetQueueOnUpdate = true,
  defaultOptions,
  processUrlSearchParams,
  rateLimitFactor = 0,
  onUrlUpdate,
  children
}: StorybookAdapterProps): ReactElement {
  // Read initial search params from Storybook's mock SearchParamsContext
  // (provided by @storybook/nextjs-vite's AppRouterProvider)
  const nextSearchParams = useSearchParams()
  const initialSearchParams = nextSearchParams.toString()
  debug('[nuqs storybook] Initial search params: %s', initialSearchParams)
  const locationSearchRef = useRef(initialSearchParams)
  resetQueues()
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(locationSearchRef.current)
  )
  const updateUrl = useCallback<AdapterInterface['updateUrl']>(
    (search, options) => {
      const queryString = renderQueryString(search)
      debug('[nuqs storybook] Updating url: %s', queryString)
      const searchParams = new URLSearchParams(search)
      setSearchParams(searchParams)
      locationSearchRef.current = queryString
      onUrlUpdate?.({
        searchParams,
        queryString,
        options
      })
    },
    [onUrlUpdate]
  )
  const getSearchParamsSnapshot = useCallback(() => {
    return new URLSearchParams(locationSearchRef.current)
  }, [initialSearchParams])
  const useAdapter = (): AdapterInterface => ({
    searchParams,
    updateUrl,
    getSearchParamsSnapshot,
    rateLimitFactor,
    autoResetQueueOnUpdate
  })
  return createElement(
    context.Provider,
    { value: { useAdapter, defaultOptions, processUrlSearchParams } },
    children
  )
}

/**
 * A Storybook decorator that wraps stories with the NuqsStorybookAdapter.
 *
 * The adapter reads initial search params from Storybook's mock router
 * (configured via story parameters), then manages state internally
 * so that nuqs updates are reflected in the UI.
 *
 * Usage:
 * ```tsx
 * // .storybook/preview.tsx
 * import { withNuqsStorybookAdapter } from 'nuqs/adapters/storybook'
 *
 * export const decorators = [withNuqsStorybookAdapter()]
 * ```
 */
export function withNuqsStorybookAdapter(
  props: Omit<StorybookAdapterProps, 'children'> = {}
) {
  return function NuqsStorybookAdapterDecorator(
    Story: React.ComponentType
  ): ReactElement {
    return createElement(NuqsStorybookAdapter, props, createElement(Story))
  }
}
