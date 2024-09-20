import { useRouter, useSearchParams } from 'next/navigation'
import type { NextRouter } from 'next/router'
import { useCallback } from 'react'
import { debug } from '../debug'
import { renderQueryString } from '../url-encoding'
import type { AdapterInterface, UpdateUrlFunction } from './defs'
import { createAdapterProvider } from './internal.context'

declare global {
  interface Window {
    next?: {
      version: string
      router?: NextRouter & {
        state: {
          asPath: string
        }
      }
    }
  }
}

function useNuqsNextAdapter(): AdapterInterface {
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
    // While the Next.js team doesn't recommend using internals like this,
    // we need access to the pages router here to let it know about non-shallow
    // updates, as going through the window.history API directly will make it
    // miss pushed history updates.
    // The router adapter imported from next/navigation also doesn't support
    // passing an asPath, causing issues in dynamic routes in the pages router.
    const nextRouter = window.next?.router
    const isPagesRouter = typeof nextRouter?.state?.asPath === 'string'
    if (isPagesRouter) {
      const url = renderURL(nextRouter.state.asPath.split('?')[0] ?? '', search)
      debug('[nuqs queue (pages)] Updating url: %s', url)
      const method =
        options.history === 'push' ? nextRouter.push : nextRouter.replace
      method.call(nextRouter, url, url, {
        scroll: options.scroll,
        shallow: options.shallow
      })
    } else {
      // App router
      const url = renderURL(location.origin + location.pathname, search)
      debug('[nuqs queue (app)] Updating url: %s', url)
      // First, update the URL locally without triggering a network request,
      // this allows keeping a reactive URL if the network is slow.
      const updateMethod =
        options.history === 'push' ? history.pushState : history.replaceState
      updateMethod.call(
        history,
        // In next@14.1.0, useSearchParams becomes reactive to shallow updates,
        // but only if passing `null` as the history state.
        null,
        '',
        url
      )
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (!options.shallow) {
        // Call the Next.js router to perform a network request
        // and re-render server components.
        router.replace(url, {
          scroll: false
        })
      }
    }
  }, [])
  return {
    searchParams,
    updateUrl,
    // See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
    rateLimitFactor: 2
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsNextAdapter)

function renderURL(base: string, search: URLSearchParams) {
  const hashlessBase = base.split('#')[0] ?? ''
  const query = renderQueryString(search)
  const hash = location.hash
  return hashlessBase + query + hash
}
