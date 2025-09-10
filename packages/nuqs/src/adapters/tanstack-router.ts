import {
  stringifySearchWith,
  parseSearchWith,
  useLocation,
  useMatches,
  useNavigate,
  type AnySchema
} from '@tanstack/react-router'
import {
  createContext,
  createElement,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode
} from 'react'
import { renderQueryString } from '../lib/url-encoding'
import { createAdapterProvider, type AdapterProps } from './lib/context'
import type { AdapterInterface, UpdateUrlFunction } from './lib/defs'

// Use TanStack Router's default JSON-based search param serialization
// The default behavior is compatible with nuqs' expected behavior
const defaultStringifySearch = stringifySearchWith(JSON.stringify)
const defaultParseSearch = parseSearchWith(JSON.parse)

type TanstackRouterAdapterContextType = {
  stringifySearchWith?: (search: Record<string, any>) => string
}

const NuqsTanstackRouterAdapterContext =
  createContext<TanstackRouterAdapterContextType>({
    stringifySearchWith: undefined
  })

function useNuqsTanstackRouterAdapter(watchKeys: string[]): AdapterInterface {
  const { stringifySearchWith } = useContext(NuqsTanstackRouterAdapterContext)

  const search = useLocation({
    select: state =>
      Object.fromEntries(
        Object.entries(state.search).filter(([key]) => watchKeys.includes(key))
      )
  })
  const navigate = useNavigate()
  const from = useMatches({
    select: matches =>
      matches.length > 0
        ? (matches[matches.length - 1]?.fullPath as string)
        : undefined
  })
  const searchParams = useMemo(() => {
    // Regardless of whether the user specified a custom parseSearchWith,
    // the search object here is already the result after parsing.
    // We use the default defaultStringifySearch to convert the search
    // to search params that nuqs can handle correctly.
    //
    // Use TSR's default stringify to convert search object → URLSearchParams.
    // This avoids issues where arrays/objects were previously flattened
    // into invalid values like "[object Object]".
    return new URLSearchParams(defaultStringifySearch(search))
  }, [search, watchKeys.join(',')])

  const updateUrl: UpdateUrlFunction = useCallback(
    (search, options) => {
      let processedSearch: URLSearchParams
      if (stringifySearchWith) {
        // When updating, the search (URLSearchParams) here is in nuqs-generated format.
        // We first use defaultParseSearch to parse it into a search object,
        // then use the custom stringifySearchWith to convert it to a new URLSearchParams.
        const searchObject = defaultParseSearch(search.toString())
        const customQueryString = stringifySearchWith(searchObject)
        processedSearch = new URLSearchParams(customQueryString)
      } else {
        // Use default behavior which is compatible with nuqs' expected behavior
        processedSearch = search
      }

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
          // When we clear the search, passing an empty string causes
          // a type error and possible basepath issues, so we switch it to '.' instead.
          // See https://github.com/47ng/nuqs/pull/953#issuecomment-3003583471
          to: renderQueryString(processedSearch) || '.',
          // `from` will be handled by tanstack router match resolver, code snippet:
          // https://github.com/TanStack/router/blob/5d940e2d8bdb12e213eede0abe8012855433ec4b/packages/react-router/src/link.tsx#L108-L112
          ...(from ? { from } : {}),
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          hash: prevHash => prevHash ?? ''
        })
      })
    },
    [navigate, from, stringifySearchWith]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1
  }
}

const NuqsTanstackRouterAdapter = createAdapterProvider(
  useNuqsTanstackRouterAdapter
)

export function NuqsAdapter({
  children,
  stringifySearchWith,
  ...adapterProps
}: AdapterProps & {
  children: ReactNode
  stringifySearchWith?: (search: Record<string, any>) => string
}): ReactElement {
  return createElement(
    NuqsTanstackRouterAdapterContext.Provider,
    { value: { stringifySearchWith } },
    createElement(NuqsTanstackRouterAdapter, { ...adapterProps, children })
  )
}
