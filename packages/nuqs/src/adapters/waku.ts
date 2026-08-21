import {
  createElement,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo
} from 'react'
import {
  unstable_parseRoute as parseRoute,
  unstable_RouterContext as RouterContext,
  useRouter
} from 'waku/router/client'
import { debug } from '../lib/debug'
import { resetQueues } from '../lib/queues/reset'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'
import { filterSearchParams } from './lib/key-isolation'

function useNuqsWakuAdapter(watchKeys: string[]): AdapterInterface {
  const { path, query, push, replace } = useRouter()
  // useRouter throws outside of a Waku Router, so the context is set here.
  const { changeRoute } = useContext(RouterContext)!
  // Key isolation: a change to an unwatched key keeps the same reference,
  // so hooks watching other keys don't re-render.
  const watchedQuery = filterSearchParams(
    new URLSearchParams(query),
    watchKeys,
    false
  ).toString()
  const searchParams = useMemo(
    () => new URLSearchParams(watchedQuery),
    [watchedQuery]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      const url = new URL(location.href)
      url.search = renderQueryString(search)
      debug(20, 'waku', url)
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (options.shallow) {
        // Commit the route change client-side only (no RSC refetch),
        // so that `useRouter().query` stays in sync with the URL.
        startTransition(() => {
          changeRoute(parseRoute(url), {
            refetch: false,
            history: options.history,
            shouldScroll: false,
            url
          }).catch(ignoreNavigationError)
        })
        return
      }
      const navigate = options.history === 'push' ? push : replace
      return navigate(path + url.search + url.hash, { scroll: false }).catch(
        ignoreNavigationError
      )
    },
    [path, push, replace, changeRoute]
  )

  return {
    searchParams,
    pathname: path,
    updateUrl
  }
}

// Waku renders navigation errors through its own error boundary,
// and the UpdateUrlFunction contract requires a non-rejecting Promise.
function ignoreNavigationError() {}

const Provider = createAdapterProvider(useNuqsWakuAdapter)

function QueueReset() {
  useEffect(() => {
    window.addEventListener('popstate', resetQueues)
    return () => window.removeEventListener('popstate', resetQueues)
  }, [])
  return null
}

export const NuqsAdapter: AdapterProvider = ({ children, ...adapterProps }) =>
  createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(QueueReset, { key: 'nuqs-adapter-queue-reset' }),
      children
    ]
  }) as ReturnType<AdapterProvider>
