import { useRouter } from 'next/compat/router.js'
import type { NextRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { debug } from '../../lib/debug'
import { globalSingleton } from '../../lib/global-singleton'
import { resetQueues } from '../../lib/queues/reset'
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

const adapterState = globalSingleton('next-pages-router-update', () => ({
  isNuqsUpdate: false,
  navigationHandled: false,
  fallbackScheduled: false
}))

function onNavigation(): void {
  if (adapterState.isNuqsUpdate) {
    return
  }
  adapterState.navigationHandled = true
  resetQueues()
}

// The isolated Bridge resets queues without the fallback listener.
export function onIsolatedNavigation(): void {
  if (!adapterState.isNuqsUpdate) {
    resetQueues()
  }
}

function onNavigationWithoutSubscribers() {
  if (adapterState.isNuqsUpdate || adapterState.fallbackScheduled) {
    return
  }
  adapterState.fallbackScheduled = true
  queueMicrotask(() => {
    if (!adapterState.navigationHandled) {
      resetQueues()
    }
    adapterState.navigationHandled = false
    adapterState.fallbackScheduled = false
  })
}

export function searchParamsFromQuery(
  query: NextRouter['query'] | undefined
): URLSearchParams {
  const searchParams = new URLSearchParams()
  if (query === undefined) {
    return searchParams
  }
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      searchParams.set(key, value)
    } else if (Array.isArray(value)) {
      for (const v of value) {
        searchParams.append(key, v)
      }
    }
  }
  return searchParams
}

export const updatePagesUrl: UpdateUrlFunction = (search, options) => {
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
  debug(20, 'next/pages', asPath)
  const method =
    options.history === 'push' ? nextRouter.push : nextRouter.replace
  adapterState.isNuqsUpdate = true
  try {
    method
      .call(
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
      .finally(() => {
        adapterState.isNuqsUpdate = false
      })
  } catch (error) {
    adapterState.isNuqsUpdate = false
    throw error
  }
}

export function useNuqsNextPagesRouterAdapter(): AdapterInterface {
  const router = useRouter()

  useEffect(() => {
    router?.events.on('routeChangeStart', onNavigation)
    router?.events.on('beforeHistoryChange', onNavigation)
    return () => {
      router?.events.off('routeChangeStart', onNavigation)
      router?.events.off('beforeHistoryChange', onNavigation)
    }
  }, [])

  const searchParams = useMemo(
    () => searchParamsFromQuery(router?.query),
    [JSON.stringify(router?.query)]
  )

  return {
    searchParams,
    updateUrl: updatePagesUrl,
    autoResetQueueOnUpdate: false
  }
}

export function NavigationSpy() {
  const router = useRouter()

  useEffect(() => {
    router?.events.on('routeChangeStart', onNavigationWithoutSubscribers)
    router?.events.on('beforeHistoryChange', onNavigationWithoutSubscribers)
    return () => {
      router?.events.off('routeChangeStart', onNavigationWithoutSubscribers)
      router?.events.off('beforeHistoryChange', onNavigationWithoutSubscribers)
    }
  }, [router?.events])

  return null
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
