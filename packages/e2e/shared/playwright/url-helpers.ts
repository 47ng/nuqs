/**
 * Extract the search string from a URL, handling both regular and hash-based routing.
 *
 * For regular routing: /page?foo=bar => ?foo=bar
 * For hash routing: /#/page?foo=bar => ?foo=bar
 */
export function getSearchFromUrl(url: URL, isHashRouter: boolean): string {
  if (isHashRouter) {
    const hash = url.hash
    const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
    const searchIndex = hashContent.indexOf('?')
    return searchIndex >= 0 ? hashContent.slice(searchIndex) : ''
  }
  return url.search
}

/**
 * Create a URL matcher function for Playwright's toHaveURL assertion.
 * Handles both regular and hash-based routing.
 */
export function createSearchMatcher(
  expectedSearch: string,
  isHashRouter: boolean
): (url: URL) => boolean {
  return (url: URL) => getSearchFromUrl(url, isHashRouter) === expectedSearch
}
