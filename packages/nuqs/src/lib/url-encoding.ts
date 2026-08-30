import { error414 } from './errors'

const encodeChar = (character: string): string =>
  character === "'" ? '%27' : encodeURIComponent(character)

export function renderQueryString(search: URLSearchParams): string {
  if (search.size === 0) {
    return ''
  }
  const query: string[] = []
  for (const [key, value] of search.entries()) {
    // Replace disallowed characters in keys,
    // see https://github.com/47ng/nuqs/issues/599
    const safeKey = key.replace(/[#&+=?]/g, encodeChar)
    query.push(`${safeKey}=${encodeQueryValue(value)}`)
  }
  const queryString = '?' + query.join('&')
  warnIfURLIsTooLong(queryString)
  return queryString
}

export function encodeQueryValue(input: string): string {
  // replace() scans the input once and does not scan the encoded replacements.
  // It therefore escapes existing % and + characters without touching the %xx
  // sequences it creates. The second pass can then turn only input spaces into +.
  return input.replace(/[%+#&"'`<>\x00-\x1F]/g, encodeChar).replace(/ /g, '+')
}

// Note: change error documentation (NUQS-414) when changing this value.
const URL_MAX_LENGTH = 2000

function warnIfURLIsTooLong(queryString: string): void {
  if (typeof location === 'undefined') {
    return
  }
  if (process.env.NODE_ENV === 'production') {
    return
  }
  const url = new URL(location.href)
  url.search = queryString
  if (url.href.length > URL_MAX_LENGTH) {
    console.warn(error414)
  }
}
