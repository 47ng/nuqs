/**
 * Utility functions for parsing and constructing hash-based URLs
 * used by HashRouter in React Router.
 *
 * HashRouter URLs have the structure: http://example.com/#/page?foo=bar
 * where the pathname and search params are contained within the hash fragment.
 */

/**
 * Extracts the search string from location.hash
 * @example getSearchFromHash("#/page?foo=bar") => "?foo=bar"
 * @example getSearchFromHash("#/page") => ""
 * @example getSearchFromHash("") => ""
 */
export function getSearchFromHash(hash: string): string {
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const searchIndex = hashContent.indexOf('?')
  return searchIndex >= 0 ? hashContent.slice(searchIndex) : ''
}

/**
 * Extracts the pathname from location.hash
 * @example getPathnameFromHash("#/page?foo=bar") => "/page"
 * @example getPathnameFromHash("#/page") => "/page"
 * @example getPathnameFromHash("") => ""
 */
export function getPathnameFromHash(hash: string): string {
  const hashContent = hash.startsWith('#') ? hash.slice(1) : hash
  const searchIndex = hashContent.indexOf('?')
  return searchIndex >= 0 ? hashContent.slice(0, searchIndex) : hashContent
}

/**
 * Constructs a hash value from pathname and search string
 * @example constructHash("/page", "?foo=bar") => "#/page?foo=bar"
 * @example constructHash("/page", "") => "#/page"
 */
export function constructHash(pathname: string, search: string): string {
  return '#' + pathname + search
}
