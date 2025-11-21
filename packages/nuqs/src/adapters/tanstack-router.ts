import { useLocation, useNavigate } from '@tanstack/react-router'
import { startTransition, useCallback, useMemo } from 'react'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProvider } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

function useNuqsTanstackRouterAdapter(watchKeys: string[]): AdapterInterface {
  const pathname = useLocation({ select: state => state.pathname })
  const search = useLocation({
    select: state =>
      Object.fromEntries(
        Object.entries(state.search).filter(([key]) => watchKeys.includes(key))
      )
  })
  const navigate = useNavigate()
  const searchParams = useMemo(
    () =>
      // search is a Record<string, string | number | object | Array<string | number>>,
      // so we need to flatten it into a list of key/value pairs,
      // replicating keys that have multiple values before passing it
      // to URLSearchParams, otherwise { foo: ['bar', 'baz'] }
      // ends up as { foo → 'bar,baz' } instead of { foo → 'bar', foo → 'baz' }
      new URLSearchParams(
        Object.entries(search).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => [key, v])
          } else if (typeof value === 'object' && value !== null) {
            // TSR JSON.parses objects in the search params,
            // but parseAsJson expects a JSON string,
            // so we need to re-stringify it first.
            return [[key, JSON.stringify(value)]]
          } else {
            return [[key, value]]
          }
        })
      ),
    [search, watchKeys.join(',')]
  )

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      // Wrapping in a startTransition seems to be necessary
      // to support scroll restoration
      startTransition(() => {
        navigate({
          // I know the docs say to use `search` here, but it would require
          // userland code to stitch the nuqs definitions to the route declarations
          // in order for TSR to serialize them, which kind of breaks the
          // "works out of the box" promise, and it also wouldn't support
          // the custom URL encoding.
          // TBC if it causes issues with consuming those search params
          // in other parts of the app.
          //
          // Note: we need to specify pathname + search here to avoid TSR appending
          // a trailing slash to the pathname, see https://github.com/47ng/nuqs/issues/1215
          from: '/',
          to: pathname + renderQueryString(search),
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          hash: prevHash => prevHash ?? '',
          state: state => state
        })
      })
    },
    [navigate, pathname]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1
  }
}

export const NuqsAdapter: AdapterProvider = createAdapterProvider(
  useNuqsTanstackRouterAdapter
)
