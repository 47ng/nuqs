import { createElement, type ReactNode } from 'react'
import { renderQueryString } from '../url-encoding'
import type { AdapterInterface, AdapterOptions } from './defs'
import { context } from './internal.context'

export type UrlUpdateEvent = {
  searchParams: URLSearchParams
  queryString: string
  options: Required<AdapterOptions>
}

type TestingAdapterProps = {
  searchParams?: string | Record<string, string> | URLSearchParams
  onUrlUpdate?: (event: UrlUpdateEvent) => void
  rateLimitFactor?: number
  children: ReactNode
}

export function NuqsTestingAdapter(props: TestingAdapterProps) {
  const useAdapter = (): AdapterInterface => ({
    searchParams: new URLSearchParams(props.searchParams),
    updateUrl(search, options) {
      props.onUrlUpdate?.({
        searchParams: search,
        queryString: renderQueryString(search),
        options
      })
    },
    rateLimitFactor: props.rateLimitFactor ?? 0
  })
  return createElement(
    context.Provider,
    { value: { useAdapter } },
    props.children
  )
}
