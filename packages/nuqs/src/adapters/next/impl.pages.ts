import { useSearchParams } from 'next/navigation.js'
import type { NextRouter } from 'next/router'
import { useCallback } from 'react'
import { debug } from '../../debug'
import { createAdapterProvider } from '../lib/context'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'
import { renderURL } from './shared'

declare global {
  interface Window {
    next?: {
      router?: NextRouter & {
        state: {
          asPath: string
        }
      }
    }
  }
}

export function isPagesRouter(): boolean {
  return typeof window.next?.router?.state?.asPath === 'string'
}

export function useNuqsNextPagesRouterAdapter(): AdapterInterface {
  const searchParams = useSearchParams()
  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
    // While the Next.js team doesn't recommend using internals like this,
    // we need access to the pages router here to let it know about non-shallow
    // updates, as going through the window.history API directly will make it
    // miss pushed history updates.
    // The router adapter imported from next/navigation also doesn't support
    // passing an asPath, causing issues in dynamic routes in the pages router.
    const nextRouter = window.next?.router!
    const url = renderURL(nextRouter.state.asPath.split('?')[0] ?? '', search)
    debug('[nuqs queue (pages)] Updating url: %s', url)
    const method =
      options.history === 'push' ? nextRouter.push : nextRouter.replace
    method.call(nextRouter, url, url, {
      scroll: options.scroll,
      shallow: options.shallow
    })
  }, [])
  return {
    searchParams,
    updateUrl,
    // See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
    rateLimitFactor: 2
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsNextPagesRouterAdapter)
