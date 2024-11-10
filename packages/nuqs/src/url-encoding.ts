import { warnIfURLIsTooLong } from './utils'

export function renderQueryString(search: URLSearchParams) {
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
  const joinedQuery = query.join('&')
  warnIfURLIsTooLong(joinedQuery)
  return '?' + joinedQuery
}

export function encodeQueryValue(input: string) {
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
  )
}
