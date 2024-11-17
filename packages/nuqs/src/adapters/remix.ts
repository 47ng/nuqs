'use client'

import { useNavigate, useSearchParams } from '@remix-run/react'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

function useNuqsRemixAdapter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    navigate(
      {
        search: renderQueryString(search),
        hash: location.hash
      },
      {
        replace: options.history === 'replace',
        preventScrollReset: !options.scroll
      }
    )
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsRemixAdapter)
