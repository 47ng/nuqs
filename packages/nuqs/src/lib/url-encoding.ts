import { error } from './errors'

export function renderQueryString(search: URLSearchParams): string {
  if (search.size === 0) {
    return ''
  }
  const query: string[] = []
  for (const [key, value] of search.entries()) {
    // Replace disallowed characters in keys,
    // see https://github.com/47ng/nuqs/issues/599
    const safeKey = key
      .replace(/#/g, '%23')
      .replace(/&/g, '%26')
      .replace(/\+/g, '%2B')
      .replace(/=/g, '%3D')
      .replace(/\?/g, '%3F')
    query.push(`${safeKey}=${encodeQueryValue(value)}`)
  }
  const queryString = '?' + query.join('&')
  warnIfURLIsTooLong(queryString)
  return queryString
}

export function encodeQueryValue(input: string): string {
  return (
    input
      // Encode existing % signs first to avoid appearing
      // as an incomplete escape sequence:
      .replace(/%/g, '%25')
      // Note: spaces are encoded as + in RFC 3986,
      // so we pre-encode existing + signs to avoid confusion
      // before converting spaces to + signs.
      .replace(/\+/g, '%2B')
      .replace(/ /g, '+')
      // Encode other URI-reserved characters
      .replace(/#/g, '%23')
      .replace(/&/g, '%26')
      // Encode characters that break URL detection on some platforms
      // and would drop the tail end of the querystring:
      .replace(/"/g, '%22')
      .replace(/'/g, '%27')
      .replace(/`/g, '%60')
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
      .replace(/{/g, '%7B')
      .replace(/}/g, '%7D')
      .replace(/\|/g, '%7C')
      .replace(/\\/g, '%5C')
      .replace(/\^/g, '%5E')
      .replace(/`/g, '%60')
      .replace(/\?/g, '%3F')
      // Encode invisible ASCII control characters
      .replace(/[\x00-\x1F]/g, char => encodeURIComponent(char))
  )
}

// Note: change error documentation (NUQS-414) when changing this value.
export const URL_MAX_LENGTH = 2000

export function warnIfURLIsTooLong(queryString: string): void {
  if (process.env.NODE_ENV === 'production') {
    return
  }
  if (typeof location === 'undefined') {
    return
  }
  const url = new URL(location.href)
  url.search = queryString
  if (url.href.length > URL_MAX_LENGTH) {
    console.warn(error(414))
  }
}
