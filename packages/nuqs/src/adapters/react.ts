'use client'

import mitt from 'mitt'
import { useEffect, useState } from 'react'
import { renderQueryString } from '../url-encoding'
import type { AdapterOptions } from './defs'
import { createAdapterProvider } from './internal.context'

const emitter = mitt<{ update: URLSearchParams }>()

function updateUrl(search: URLSearchParams, options: AdapterOptions) {
  const url = new URL(location.href)
  url.search = renderQueryString(search)
  const method =
    options.history === 'push' ? history.pushState : history.replaceState
  method.call(history, history.state, '', url)
  emitter.emit('update', search)
}

function useNuqsReactAdapter() {
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof location === 'undefined') {
      return new URLSearchParams()
    }
    return new URLSearchParams(location.search)
  })
  useEffect(() => {
    // Popstate event is only fired when the user navigates
    // via the browser's back/forward buttons.
    const onPopState = () => {
      setSearchParams(new URLSearchParams(location.search))
    }
    emitter.on('update', setSearchParams)
    window.addEventListener('popstate', onPopState)
    return () => {
      emitter.off('update', setSearchParams)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])
  return {
    searchParams,
    updateUrl
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsReactAdapter)
