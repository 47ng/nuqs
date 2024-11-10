import { warn } from './debug'
import { error } from './errors'
import type { Parser } from './parsers'

// Change error documentation after changing this value.
export const URL_MAX_LENGTH = 2000

export function safeParse<T>(
  parser: Parser<T>['parse'],
  value: string,
  key?: string
) {
  try {
    return parser(value)
  } catch (error) {
    warn(
      '[nuqs] Error while parsing value `%s`: %O' +
        (key ? ' (for key `%s`)' : ''),
      value,
      error,
      key
    )
    return null
  }
}

// 50ms between calls to the history API seems to satisfy Chrome and Firefox.
// Safari remains annoying with at most 100 calls in 30 seconds.
// edit: Safari 17 now allows 100 calls per 10 seconds, a bit better.
export function getDefaultThrottle() {
  if (typeof window === 'undefined') return 50
  // https://stackoverflow.com/questions/7944460/detect-safari-browser
  // @ts-expect-error
  const isSafari = Boolean(window.GestureEvent)
  if (!isSafari) {
    return 50
  }
  try {
    const match = navigator.userAgent?.match(/version\/([\d\.]+) safari/i)
    return parseFloat(match![1]!) >= 17 ? 120 : 320
  } catch {
    return 320
  }
}

export function warnIfURLIsTooLong(queryString: string) {
  if (process.env.NODE_ENV != 'development') {
    return
  }
  const url = new URL(window.location.href)
  url.search = queryString
  if (url.href.length > URL_MAX_LENGTH) {
    console.warn(error(414))
  }
}
