import { useRouter } from 'next/compat/router'
import type { NextRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
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
    // we need access to the pages router here to let it know about non-shallow
    // updates, as going through the window.history API directly will make it
    // miss pushed history updates.
    // The router adapter imported from next/navigation also doesn't support
    // passing an asPath, causing issues in dynamic routes in the pages router.
    const nextRouter = window.next?.router!
    const urlParams = extractDynamicUrlParams(
      nextRouter.pathname,
      nextRouter.query
    )
    const query = Object.fromEntries(search.entries())
    const asPath = renderURL(
      nextRouter.state.asPath.split('?')[0] ?? '',
      search
    )
    debug('[nuqs queue (pages)] Updating url: %s', asPath)
    const method =
      options.history === 'push' ? nextRouter.push : nextRouter.replace

    method.call(
      nextRouter,
      {
        pathname: nextRouter.pathname,
        query: {
          ...urlParams,
          ...query
        },
        hash: location.hash
      },
      {
        pathname: nextRouter.state.asPath.split('?')[0] ?? '',
        query,
        hash: location.hash
      },
      {
        scroll: options.scroll,
        shallow: options.shallow
      }
    )
  }, [])
  return {
    searchParams,
    updateUrl,
    // See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
    rateLimitFactor: 1
  }
}

export const NuqsAdapter = createAdapterProvider(useNuqsNextPagesRouterAdapter)

function extractDynamicUrlParams(
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
  const matchOptionalCatchAll = optionalCatchAllRegex.exec(pathname)
  if (matchCatchAll) {
    dynamicValues[matchCatchAll[1]!] = values[matchCatchAll[1]!] ?? []
  }
  if (matchOptionalCatchAll) {
    dynamicValues[matchOptionalCatchAll[1]!] =
      values[matchOptionalCatchAll[1]!] ?? []
  }
  return dynamicValues
}
