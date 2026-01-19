/**
 * Router mode strategies for handling URL search params in different routing modes.
 *
 * Standard mode: Uses location.search (e.g., /page?foo=bar)
 * Hash mode: Uses location.hash (e.g., /#/page?foo=bar)
 */

import { renderQueryString } from '../../lib/url-encoding'
import {
  constructHash,
  getPathnameFromHash,
  getSearchFromHash
} from './hash-router-utils'

export type RouterMode = 'standard' | 'hash'

/**
 * Strategy interface that encapsulates mode-specific URL handling behavior.
 */
export interface RouterModeStrategy {
  /**
   * Read URLSearchParams from the current location
   */
  getSearchParams(): URLSearchParams

  /**
   * Get the search string portion for comparison (e.g., "?foo=bar" or "")
   */
  getSearchString(): string

  /**
   * Construct URL with updated search params
   */
  constructUrl(search: URLSearchParams): URL

  /**
   * Event names to listen for navigation changes
   */
  navigationEvents: readonly ('popstate' | 'hashchange')[]

  /**
   * Whether navigate() should be called for non-shallow updates.
   * Hash mode doesn't support this since hash is never sent to server.
   */
  supportsServerNavigation: boolean

  /**
   * Queue reset mutex value.
   * Standard mode uses 1 for shallow, 2 for non-shallow.
   * Hash mode always uses 1 since it's client-side only.
   */
  getQueueResetMutex(shallow: boolean): 1 | 2

  /**
   * Extract search params from a URL (for history patching sync)
   */
  extractSearchParamsFromUrl(url: URL | string): URLSearchParams | null

  /**
   * Extract search string from URL for comparison (for history patching)
   */
  extractSearchStringFromUrl(url: URL | string): string | null
}

/**
 * Creates a strategy for standard routing (location.search)
 */
export function createStandardStrategy(): RouterModeStrategy {
  return {
    getSearchParams() {
      return new URLSearchParams(location.search)
    },

    getSearchString() {
      return location.search
    },

    constructUrl(search: URLSearchParams): URL {
      const url = new URL(location.href)
      url.search = renderQueryString(search)
      return url
    },

    navigationEvents: ['popstate'] as const,

    supportsServerNavigation: true,

    getQueueResetMutex(shallow: boolean) {
      return shallow ? 1 : 2
    },

    extractSearchParamsFromUrl(url: URL | string): URLSearchParams | null {
      try {
        if (url instanceof URL) {
          return url.searchParams
        }
        if (typeof url === 'string') {
          if (url.startsWith('?')) {
            return new URLSearchParams(url)
          }
          return new URL(url, location.origin).searchParams
        }
        return null
      } catch {
        if (typeof url === 'string') {
          return new URLSearchParams(url)
        }
        return null
      }
    },

    extractSearchStringFromUrl(url: URL | string): string | null {
      try {
        if (url instanceof URL) {
          return url.search
        }
        return new URL(url, location.origin).search
      } catch {
        return null
      }
    }
  }
}

/**
 * Creates a strategy for hash routing (location.hash)
 * Used by React Router's HashRouter where pathname and search are in the hash fragment.
 */
export function createHashStrategy(): RouterModeStrategy {
  function extractHashFromUrl(url: URL | string): string | null {
    try {
      if (url instanceof URL) {
        return url.hash
      }
      if (typeof url === 'string' && url.includes('#')) {
        return url.slice(url.indexOf('#'))
      }
      return null
    } catch {
      return null
    }
  }

  return {
    getSearchParams() {
      const search = getSearchFromHash(location.hash)
      return new URLSearchParams(search)
    },

    getSearchString() {
      return getSearchFromHash(location.hash)
    },

    constructUrl(search: URLSearchParams): URL {
      const currentPathname = getPathnameFromHash(location.hash)
      const queryString = renderQueryString(search)
      const newHash = constructHash(currentPathname, queryString)

      const url = new URL(location.href)
      url.hash = newHash
      // Clear main URL search params (they belong in the hash)
      url.search = ''
      return url
    },

    navigationEvents: ['popstate', 'hashchange'] as const,

    // Hash is never sent to server, so shallow:false has no effect
    supportsServerNavigation: false,

    getQueueResetMutex(_shallow: boolean) {
      // Always 1 since hash mode is client-side only
      return 1 as const
    },

    extractSearchParamsFromUrl(url: URL | string): URLSearchParams | null {
      const hash = extractHashFromUrl(url)
      if (!hash) return null
      const search = getSearchFromHash(hash)
      return new URLSearchParams(search)
    },

    extractSearchStringFromUrl(url: URL | string): string | null {
      const hash = extractHashFromUrl(url)
      if (!hash) return null
      return getSearchFromHash(hash)
    }
  }
}

/**
 * Factory function to create the appropriate strategy based on mode.
 */
export function createStrategy(mode: RouterMode): RouterModeStrategy {
  return mode === 'hash' ? createHashStrategy() : createStandardStrategy()
}
