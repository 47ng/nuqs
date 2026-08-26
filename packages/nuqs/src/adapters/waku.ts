import {
  createElement,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
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

// Waku commits navigations asynchronously (in a transition, or after an RSC
// fetch), so `useRouter().query` lags behind updateUrl. Hooks read the
// optimistic search until the router moves on from the query it was based on.
type OptimisticSearch = {
  search: URLSearchParams
  baseQuery: string
  targets: Set<string>
}

let optimistic: OptimisticSearch | null = null
let lastRoute: string | null = null

function useNuqsWakuAdapter(watchKeys: string[]): AdapterInterface {
  const { path, query, push, replace } = useRouter()
  // useRouter() above throws when RouterContext is null, so the assertion is safe.
  const { changeRoute } = useContext(RouterContext)!
  const queryRef = useRef(query)
  queryRef.current = query
  const source =
    optimistic !== null && optimistic.baseQuery === query
      ? optimistic.search
      : new URLSearchParams(query)
  const watchedQuery = filterSearchParams(source, watchKeys, true).toString()
  // Memoised on the filtered string: a change to an unwatched key keeps the
  // same URLSearchParams reference, so hooks watching other keys don't re-render.
  const searchParams = useMemo(
    () => new URLSearchParams(watchedQuery),
    [watchedQuery]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      const url = new URL(location.href)
      url.search = renderQueryString(search)
      debug(20, 'waku', url)
      const target = url.searchParams.toString()
      if (optimistic?.baseQuery === queryRef.current) {
        optimistic.search = search
        optimistic.targets.add(target)
      } else {
        optimistic = {
          search,
          baseQuery: queryRef.current,
          targets: new Set([target])
        }
      }
      if (options.scroll) {
        window.scrollTo(0, 0)
      }
      if (options.shallow) {
        // Updates Waku's route state without an RSC fetch.
        // A bare history.pushState would leave useRouter().query stale.
        startTransition(() => {
          void changeRoute(parseRoute(url), {
            refetch: false,
            history: options.history,
            shouldScroll: false,
            url
          })
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

// Waku already shows navigation errors in its error boundary,
// and UpdateUrlFunction must not reject: drop the duplicate rejection.
function ignoreNavigationError() {}

const Provider = createAdapterProvider(useNuqsWakuAdapter)

// Waku does not expose pending routes through useRouter(). Its Link starts the
// asynchronous navigation before the click bubbles to document, giving us a
// stable boundary where pending nuqs updates can be cancelled first.
function resetQueuesOnLinkClick(event: MouseEvent) {
  const isPlainLeftClick =
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  const followsLink = event
    .composedPath()
    .some(
      target =>
        target instanceof HTMLAnchorElement &&
        (target.target === '' || target.target === '_self') &&
        target.download === ''
    )
  if (isPlainLeftClick && followsLink) {
    optimistic = null
    resetQueues()
  }
}

// Tracks committed route changes: settles the optimistic search when one of
// nuqs' own navigations lands, and resets the update queues when anything else
// moves the route (Link clicks, back/forward, redirects), so pending updates
// don't flush onto the new location.
function RouteSpy() {
  const { path, query } = useRouter()
  useLayoutEffect(() => {
    const route = path + '?' + query
    const isFirstRoute = lastRoute === null
    const isOwnNavigation =
      !isFirstRoute &&
      lastRoute?.startsWith(path + '?') === true &&
      optimistic?.targets.has(query) === true
    lastRoute = route
    if (isFirstRoute) {
      return
    }
    if (isOwnNavigation && optimistic !== null) {
      optimistic.targets.delete(query)
      optimistic =
        optimistic.targets.size === 0
          ? null
          : { ...optimistic, baseQuery: query }
      return
    }
    optimistic = null
    resetQueues()
  }, [path, query])
  useEffect(() => {
    document.addEventListener('click', resetQueuesOnLinkClick)
    window.addEventListener('popstate', resetQueues)
    return () => {
      document.removeEventListener('click', resetQueuesOnLinkClick)
      window.removeEventListener('popstate', resetQueues)
    }
  }, [])
  return null
}

export const NuqsAdapter: AdapterProvider = ({ children, ...adapterProps }) =>
  createElement(Provider, {
    ...adapterProps,
    children: [
      createElement(RouteSpy, { key: 'nuqs-adapter-route-spy' }),
      children
    ]
  }) as ReturnType<AdapterProvider>
