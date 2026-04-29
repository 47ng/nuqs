import { error } from './errors'

const pe = (c: string): string =>
  '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()

export function renderQueryString(search: URLSearchParams): string {
  if (search.size === 0) {
    return ''
  }
  const query: string[] = []
  for (const [key, value] of search.entries()) {
    // Replace disallowed characters in keys,
    // see https://github.com/47ng/nuqs/issues/599
    const safeKey = key.replace(/[#&+=?]/g, pe)
    query.push(`${safeKey}=${encodeQueryValue(value)}`)
  }
  const queryString = '?' + query.join('&')
  warnIfURLIsTooLong(queryString)
  return queryString
}

export function encodeQueryValue(input: string): string {
  // Encode % first (escape sequence safety), pre-encode + so spaces->+
  // doesn't get re-encoded, then handle other reserved & control chars,
  // and finally turn spaces into +.
  return input
    .replace(/[%+#&"'`<>\x00-\x1F]/g, pe)
    .replace(/ /g, '+')
}

// Note: change error documentation (NUQS-414) when changing this value.
const URL_MAX_LENGTH = 2000

function warnIfURLIsTooLong(queryString: string): void {
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
