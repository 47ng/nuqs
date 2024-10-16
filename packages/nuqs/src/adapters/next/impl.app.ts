import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { debug } from '../../debug'
import type { AdapterInterface, UpdateUrlFunction } from '../defs'
import { renderURL } from './shared'

export function useNuqsNextAppRouterAdapter(): AdapterInterface {
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
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
  }, [])
  return {
    searchParams,
    updateUrl,
    // See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
    rateLimitFactor: 2
  }
}
