import { error } from './errors'

export type ConfigureOptions = {
  /**
   * When `false`, query strings are rendered with `URLSearchParams`
   * (`application/x-www-form-urlencoded`) instead of the default pretty
   * encoding, which leaves characters such as `[]{}` unescaped.
   *
   * Some tools truncate URLs that contain those characters (for example
   * Slack, when a `parseAsJson` value includes braces). Opting out keeps
   * the written URL compatible with those tools. Parsing is unchanged:
   * the platform decodes either form before nuqs reads it.
   *
   * Call `configure` in every runtime that writes URLs (client hooks and
   * server serializers are separate bundles).
   *
   * @default true
   */
  prettyEncoding?: boolean
}

// Per module instance. Duplicate copies of nuqs each keep their own flag;
// call `configure` on the copy that renders the URL.
let prettyEncoding = true

/**
 * Set library-wide defaults. Currently controls how query strings are encoded.
 *
 * @see https://github.com/47ng/nuqs/issues/1572
 */
export function configure(options: ConfigureOptions): void {
  prettyEncoding = options.prettyEncoding ?? prettyEncoding
}

export function renderQueryString(search: URLSearchParams): string {
  if (search.size === 0) {
    return ''
  }
  // `false` uses URLSearchParams (application/x-www-form-urlencoded).
  const queryString = prettyEncoding
    ? renderPrettyQueryString(search)
    : '?' + search.toString()
  warnIfURLIsTooLong(queryString)
  return queryString
}

function renderPrettyQueryString(search: URLSearchParams): string {
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
  return '?' + query.join('&')
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
      // Encode invisible ASCII control characters
      .replace(/[\x00-\x1F]/g, char => encodeURIComponent(char))
  )
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
    console.warn(error(414))
  }
}
