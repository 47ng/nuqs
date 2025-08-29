import {
  createElement,
  useCallback,
  useMemo,
  type ReactElement,
  type ReactNode
} from 'react'
import { resetQueues } from '../lib/queues/reset'
import { renderQueryString } from './custom'
import { context, type AdapterProps } from './lib/context'
import type { AdapterInterface, AdapterOptions } from './lib/defs'

export type UrlUpdateEvent = {
  searchParams: URLSearchParams
  queryString: string
  options: Required<AdapterOptions>
}

export type OnUrlUpdateFunction = (event: UrlUpdateEvent) => void

type TestingAdapterProps = {
  searchParams?: string | Record<string, string> | URLSearchParams
  onUrlUpdate?: OnUrlUpdateFunction
  rateLimitFactor?: number
  resetUrlUpdateQueueOnMount?: boolean
  children: ReactNode
} & AdapterProps

export function NuqsTestingAdapter({
  resetUrlUpdateQueueOnMount = true,
  defaultOptions,
  ...props
}: TestingAdapterProps): ReactElement {
  if (resetUrlUpdateQueueOnMount) {
    resetQueues()
  }
  const searchParams = useMemo(
    () => new URLSearchParams(props.searchParams),
    [props.searchParams?.toString()]
  )
  const updateUrl = useCallback<AdapterInterface['updateUrl']>(
    (search, options) => {
      props.onUrlUpdate?.({
        searchParams: new URLSearchParams(search),
        queryString: renderQueryString(search),
        options
      })
    },
    [props.onUrlUpdate]
  )
  const getSearchParamsSnapshot = useCallback(() => {
    return new URLSearchParams(props.searchParams)
  }, [props.searchParams?.toString()])
  const useAdapter = (): AdapterInterface => ({
    searchParams,
    updateUrl,
    getSearchParamsSnapshot,
    rateLimitFactor: props.rateLimitFactor ?? 0
  })
  return createElement(
    context.Provider,
    { value: { useAdapter, defaultOptions } },
    props.children
  )
}

/**
 * A higher order component that wraps the children with the NuqsTestingAdapter
 *
 * It allows creating wrappers for testing purposes by providing only the
 * necessary props to the NuqsTestingAdapter.
 *
 * Usage:
 * ```tsx
 * render(<MyComponent />, {
 *   wrapper: withNuqsTestingAdapter({ searchParams: '?foo=bar' })
 * })
 * ```
 */
export function withNuqsTestingAdapter(
  props: Omit<TestingAdapterProps, 'children'> = {}
) {
  return function NuqsTestingAdapterWrapper({
    children
  }: {
    children: ReactNode
  }): ReactElement {
    return createElement(
      NuqsTestingAdapter,
      // @ts-expect-error - Ignore missing children error
      props,
      children
    )
  }
}
