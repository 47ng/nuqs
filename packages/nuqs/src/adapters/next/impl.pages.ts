import { useRouter } from 'next/compat/router.js'
import type { NextRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { debug } from '../../lib/debug'
import { renderQueryString } from '../../lib/url-encoding'
import type { AdapterInterface, UpdateUrlFunction } from '../lib/defs'

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
  const router = useRouter()
  const searchParams = useMemo(() => {
    const searchParams = new URLSearchParams()
    if (router === null) {
      return searchParams
    }
    for (const [key, value] of Object.entries(router.query)) {
      if (typeof value === 'string') {
        searchParams.set(key, value)
      } else if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v)
        }
      }
    }
    return searchParams
  }, [JSON.stringify(router?.query)])

  const updateUrl: UpdateUrlFunction = useCallback((search, options) => {
    // While the Next.js team doesn't recommend using internals like this,
    // we need direct access to the pages router, as a bound/closured version from
    // useRouter may be out of date by the time the updateUrl function is called,
    // and would also cause updateUrl to not be referentially stable.
    const nextRouter = window.next?.router!
    const urlParams = extractDynamicUrlParams(
      nextRouter.pathname,
      nextRouter.query
    )
    const asPath =
      getAsPathPathname(nextRouter.asPath) +
      renderQueryString(search) +
      location.hash
    debug('[nuqs next/pages] Updating url: %s', asPath)
    const method =
      options.history === 'push' ? nextRouter.push : nextRouter.replace
    method.call(
      nextRouter,
      // This is what makes the URL work (mapping dynamic segments placeholders
      // in pathname to their values in query, plus search params in query too).
      {
        pathname: nextRouter.pathname,
        query: {
          // Note: we put search params first so that one that conflicts
          // with dynamic params will be overwritten.
          ...urlSearchParamsToObject(search),
          ...urlParams
        }
        // For some reason we don't need to pass the hash here,
        // it's preserved when passed as part of the asPath.
      },
      // This is what makes the URL pretty (resolved dynamic segments
      // and nuqs-formatted search params).
      asPath,
      // And these are the options that are passed to the router.
      {
        scroll: options.scroll,
        shallow: options.shallow
      }
    )
  }, [])
  return {
    searchParams,
    updateUrl
  }
}

export function getAsPathPathname(asPath: string): string {
  return asPath
    .replace(/#.*$/, '') // Remove hash
    .replace(/\?.*$/, '') // Remove search
}

export function urlSearchParamsToObject(
  search: URLSearchParams
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const key of search.keys()) {
    const values = search.getAll(key)
    if (values.length === 1) {
      out[key] = values[0]!
    } else if (values.length > 1) {
      out[key] = values
    }
  }
  return out
}

/**
 * Next.js pages router merges dynamic URL params with search params in its
 * internal state.
 * However, we need to pass just the URL params to the href part of the router
 * update functions.
 * This function finds the dynamic URL params placeholders in the pathname
 * (eg: `/path/[foo]/[bar]`) and extracts the corresponding values from the
 * query state object, leaving out any other search params.
 */
export function extractDynamicUrlParams(
  pathname: string,
  values: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const paramNames = new Set<string>()
  const dynamicRegex = /\[([^\]]+)\]/g
  const catchAllRegex = /\[\.{3}([^\]]+)\]$/
  const optionalCatchAllRegex = /\[\[\.{3}([^\]]+)\]\]$/

  let match
  while ((match = dynamicRegex.exec(pathname)) !== null) {
    const paramName = match[1]
    if (paramName) {
      paramNames.add(paramName)
    }
  }
  const dynamicValues = Object.fromEntries(
    Object.entries(values).filter(([key]) => paramNames.has(key))
  )
  const matchCatchAll = catchAllRegex.exec(pathname)
  if (matchCatchAll && matchCatchAll[1]) {
    const key = matchCatchAll[1]
    dynamicValues[key] = values[key] ?? []
  }
  const matchOptionalCatchAll = optionalCatchAllRegex.exec(pathname)
  if (matchOptionalCatchAll && matchOptionalCatchAll[1]) {
    const key = matchOptionalCatchAll[1]
    // Note: while Next.js returns undefined if there are no values for the
    // optional catch-all, passing undefined back when setting the state
    // results in the value being set to an empty string.
    // Passing an empty array instead results in the value remaining undefined.
    dynamicValues[key] = values[key] ?? []
  }
  return dynamicValues
}
