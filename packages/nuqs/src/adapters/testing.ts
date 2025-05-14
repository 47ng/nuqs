import { createElement, Fragment, type ReactNode } from 'react'
import { resetQueue } from '../update-queue'
import { renderQueryString } from '../url-encoding'
import { context } from './lib/context'
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
}

export function NuqsTestingAdapter({
  resetUrlUpdateQueueOnMount = true,
  ...props
}: TestingAdapterProps) {
  if (resetUrlUpdateQueueOnMount) {
    resetQueue()
  }
  const useAdapter = (): AdapterInterface => ({
    searchParams: new URLSearchParams(props.searchParams),
    updateUrl(search, options) {
      props.onUrlUpdate?.({
        searchParams: search,
        queryString: renderQueryString(search),
        options
      })
    },
    getSearchParamsSnapshot() {
      return new URLSearchParams(props.searchParams)
    },
    rateLimitFactor: props.rateLimitFactor ?? 0
  })

  context.set({ useAdapter })

  return createElement(Fragment, null, props.children)
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
  }) {
    return createElement(
      NuqsTestingAdapter,
      // @ts-expect-error - Ignore missing children error
      props,
      children
    )
  }
}
