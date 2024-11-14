import { createElement, type ReactNode } from 'react'
import { resetQueue } from '../update-queue'
import { renderQueryString } from '../url-encoding'
import type { AdapterInterface, AdapterOptions } from './defs'
import { context } from './internal.context'

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
    rateLimitFactor: props.rateLimitFactor ?? 0
  })
  return createElement(
    context.Provider,
    { value: { useAdapter } },
    props.children
  )
}
