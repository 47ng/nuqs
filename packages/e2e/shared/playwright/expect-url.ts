import { type Page, expect } from '@playwright/test'

type ExpectUrlOptions = {
  message?: string
  timeout?: number
  intervals?: number[]
}

/**
 * Extract search string from a URL.
 * For hash mode, extracts from hash fragment (e.g., /#/page?foo=bar => ?foo=bar)
 * For standard mode, uses url.search
 */
function getSearchFromUrl(url: URL, isHashRouter: boolean): string {
  if (!isHashRouter) {
    return url.search
  }
  const hash = url.hash
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const searchIndex = hashContent.indexOf('?')
  return searchIndex >= 0 ? hashContent.slice(searchIndex) : ''
}

/**
 * Get URLSearchParams from a URL.
 * For hash mode, extracts from hash fragment.
 * For standard mode, uses url.searchParams.
 */
function getSearchParamsFromUrl(
  url: URL,
  isHashRouter: boolean
): URLSearchParams {
  if (!isHashRouter) {
    return url.searchParams
  }
  const searchString = getSearchFromUrl(url, true)
  return new URLSearchParams(searchString)
}

export function expectUrl(
  page: Page,
  predicate: (url: URL) => boolean,
  options: ExpectUrlOptions = {}
) {
  return expect
    .poll(() => predicate(new URL(page.url())), {
      intervals:
        options.intervals ??
        Array.from({ length: (options.timeout ?? 5000) / 50 }, _ => 50),
      timeout: options.timeout ?? 5000,
      message: options.message
    })
    .toBe(true)
}

export function expectSearch(
  page: Page,
  expected: Record<string, string>,
  isHashRouter = false
) {
  return expectUrl(
    page,
    url => {
      const params = getSearchParamsFromUrl(url, isHashRouter)
      return Object.entries(expected).every(
        ([key, value]) => params.get(key) === value
      )
    },
    { message: `URL search params to match ${JSON.stringify(expected)}` }
  )
}

/**
 * Create a matcher function for comparing URL search strings.
 * Works with both standard and hash router modes.
 */
export function createSearchMatcher(
  expected: string,
  isHashRouter: boolean
): (url: URL) => boolean {
  return url => getSearchFromUrl(url, isHashRouter) === expected
}

/**
 * Create a matcher function that checks if URL search contains a substring.
 * Works with both standard and hash router modes.
 */
export function createSearchIncludesMatcher(
  substring: string,
  isHashRouter: boolean
): (url: URL) => boolean {
  return url => getSearchFromUrl(url, isHashRouter).includes(substring)
}

/**
 * Create a matcher function that checks if URL search ends with a substring.
 * Works with both standard and hash router modes.
 */
export function createSearchEndsWithMatcher(
  suffix: string,
  isHashRouter: boolean
): (url: URL) => boolean {
  return url => getSearchFromUrl(url, isHashRouter).endsWith(suffix)
}
