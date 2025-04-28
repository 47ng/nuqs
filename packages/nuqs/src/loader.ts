import type { UrlKeys } from './defs'
import type { inferParserType, ParserMap } from './parsers'

export type LoaderInput =
  | URL
  | Request
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | string

export type LoaderOptions<Parsers extends ParserMap> = {
  urlKeys?: UrlKeys<Parsers>
}

export type LoaderFunction<Parsers extends ParserMap> = {
  /**
   * Load & parse search params from (almost) any input.
   *
   * While loaders are typically used in the context of a React Router / Remix
   * loader function, it can also be used in Next.js API routes or
   * getServerSideProps functions, or even with the app router `searchParams`
   * page prop (sync or async), if you don't need the cache behaviours.
   */
  (
    input: LoaderInput,
    options?: LoaderOptions<Parsers>
  ): inferParserType<Parsers>
  /**
   * Load & parse search params from (almost) any input.
   *
   * While loaders are typically used in the context of a React Router / Remix
   * loader function, it can also be used in Next.js API routes or
   * getServerSideProps functions, or even with the app router `searchParams`
   * page prop (sync or async), if you don't need the cache behaviours.
   *
   * Note: this async overload makes it easier to use against the `searchParams`
   * page prop in Next.js 15 app router:
   *
   * ```tsx
   * export default async function Page({ searchParams }) {
   *   const parsedSearchParamsPromise = loadSearchParams(searchParams)
   *   return (
   *     // Pre-render & stream the shell immediately
   *     <StaticShell>
   *       <Suspense>
   *         // Stream the Promise down
   *         <DynamicComponent searchParams={parsedSearchParamsPromise} />
   *       </Suspense>
   *      </StaticShell>
   *   )
   * }
   * ```
   */
  (
    input: Promise<LoaderInput>,
    options?: LoaderOptions<Parsers>
  ): Promise<inferParserType<Parsers>>
}

export function createLoader<Parsers extends ParserMap>(
  parsers: Parsers,
  { urlKeys = {} }: LoaderOptions<Parsers> = {}
): LoaderFunction<Parsers> {
  type ParsedSearchParams = inferParserType<Parsers>

  /**
   * Load & parse search params from (almost) any input.
   *
   * While loaders are typically used in the context of a React Router / Remix
   * loader function, it can also be used in Next.js API routes or
   * getServerSideProps functions, or even with the app router `searchParams`
   * page prop (sync or async), if you don't need the cache behaviours.
   */
  function loadSearchParams(
    input: LoaderInput,
    options?: LoaderOptions<Parsers>
  ): ParsedSearchParams

  /**
   * Load & parse search params from (almost) any input.
   *
   * While loaders are typically used in the context of a React Router / Remix
   * loader function, it can also be used in Next.js API routes or
   * getServerSideProps functions, or even with the app router `searchParams`
   * page prop (sync or async), if you don't need the cache behaviours.
   *
   * Note: this async overload makes it easier to use against the `searchParams`
   * page prop in Next.js 15 app router:
   *
   * ```tsx
   * export default async function Page({ searchParams }) {
   *   const parsedSearchParamsPromise = loadSearchParams(searchParams)
   *   return (
   *     // Pre-render & stream the shell immediately
   *     <StaticShell>
   *       <Suspense>
   *         // Stream the Promise down
   *         <DynamicComponent searchParams={parsedSearchParamsPromise} />
   *       </Suspense>
   *      </StaticShell>
   *   )
   * }
   * ```
   */
  function loadSearchParams(
    input: Promise<LoaderInput>,
    options?: LoaderOptions<Parsers>
  ): Promise<ParsedSearchParams>

  function loadSearchParams(input: LoaderInput | Promise<LoaderInput>) {
    if (input instanceof Promise) {
      return input.then(i => loadSearchParams(i))
    }
    const searchParams = extractSearchParams(input)
    const result = {} as any
    for (const [key, parser] of Object.entries(parsers)) {
      const urlKey = urlKeys[key] ?? key
      const value = searchParams.get(urlKey)
      result[key] = parser.parseServerSide(value ?? undefined)
    }
    return result
  }
  return loadSearchParams
}

function extractSearchParams(input: LoaderInput): URLSearchParams {
  try {
    if (input instanceof Request) {
      if (input.url) {
        return new URL(input.url).searchParams
      } else {
        return new URLSearchParams()
      }
    }
    if (input instanceof URL) {
      return input.searchParams
    }
    if (input instanceof URLSearchParams) {
      return input
    }
    if (typeof input === 'object') {
      const entries = Object.entries(input)
      const searchParams = new URLSearchParams()
      for (const [key, value] of entries) {
        if (Array.isArray(value)) {
          for (const v of value) {
            searchParams.append(key, v)
          }
        } else if (value !== undefined) {
          searchParams.set(key, value)
        }
      }
      return searchParams
    }
    if (typeof input === 'string') {
      if ('canParse' in URL && URL.canParse(input)) {
        return new URL(input).searchParams
      }
      return new URLSearchParams(input)
    }
  } catch (e) {
    return new URLSearchParams()
  }
  return new URLSearchParams()
}
