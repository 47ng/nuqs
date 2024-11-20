import { useNavigate, useSearchParams } from '@remix-run/react'
import mitt from 'mitt'
import { startTransition, useEffect, useLayoutEffect, useState } from 'react'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

const emitter = mitt<{ update: URLSearchParams }>()

function useNuqsRemixAdapter() {
  const navigate = useNavigate()
  const searchParams = useOptimisticSearchParams()
  const updateUrl = (search: URLSearchParams, options: AdapterOptions) => {
    startTransition(() => {
      emitter.emit('update', search)
    })
    const url = new URL(location.href)
    url.search = renderQueryString(search)
    // First, update the URL locally without triggering a network request,
    // this allows keeping a reactive URL if the network is slow.
    const updateMethod =
      options.history === 'push' ? history.pushState : history.replaceState
    updateMethod.call(
      history,
      history.state, // Maintain the history state
      '',
      url
    )
    if (options.scroll) {
      window.scrollTo(0, 0)
    }
    if (!options.shallow) {
      navigate(url, {
        replace: true,
        preventScrollReset: true
      })
    }
  }
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsRemixAdapter)

export function useOptimisticSearchParams() {
  const [serverSearchParams] = useSearchParams()
  const [searchParams, setSearchParams] = useState(serverSearchParams)
  useEffect(() => {
    emitter.on('update', setSearchParams)
    return () => {
      emitter.off('update', setSearchParams)
    }
  }, [])
  useLayoutEffect(() => {
    emitter.emit('update', serverSearchParams)
  }, [serverSearchParams])
  return searchParams
}
