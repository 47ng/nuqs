import { afterEach, describe, expect, it } from 'vitest'
import { parseAsJson } from '../parsers'
import { createSerializer } from '../serializer'
import { configure, renderQueryString } from './url-encoding'

// Issue #1572: JSON in the query string. Expected strings are fixed literals
// (pretty encoding leaves braces; URLSearchParams percent-encodes them).
const slackQuery = {
  queries: [{ query: 'http_request_errors{service="foo"}' }]
}
const prettySlackQuery =
  '?queries=[{%22query%22:%22http_request_errors{service=\\%22foo\\%22}%22}]'
const standardSlackQuery =
  '?queries=%5B%7B%22query%22%3A%22http_request_errors%7Bservice%3D%5C%22foo%5C%22%7D%22%7D%5D'

afterEach(() => {
  configure({ prettyEncoding: true })
})

describe('configure prettyEncoding', () => {
  it('leaves braces unencoded by default', () => {
    const search = new URLSearchParams()
    search.set('q', '{}')
    expect(renderQueryString(search)).toBe('?q={}')
  })

  it('renders with URLSearchParams when pretty encoding is off', () => {
    configure({ prettyEncoding: false })
    const search = new URLSearchParams()
    search.set(
      'queries',
      '[{"query":"http_request_errors{service=\\"foo\\"}"}]'
    )
    expect(renderQueryString(search)).toBe(standardSlackQuery)
  })

  it('percent-encodes braces, brackets, and quotes', () => {
    configure({ prettyEncoding: false })
    const search = new URLSearchParams()
    search.set('q', '[]{} "')
    expect(renderQueryString(search)).toBe('?q=%5B%5D%7B%7D+%22')
  })

  it('keeps an empty search empty', () => {
    configure({ prettyEncoding: false })
    expect(renderQueryString(new URLSearchParams())).toBe('')
  })

  it('keeps the current encoding when the option is omitted', () => {
    configure({ prettyEncoding: false })
    configure({})
    const search = new URLSearchParams()
    search.set('q', '{}')
    expect(renderQueryString(search)).toBe('?q=%7B%7D')
  })

  it('restores pretty encoding', () => {
    configure({ prettyEncoding: false })
    configure({ prettyEncoding: true })
    const search = new URLSearchParams()
    search.set('q', '{}')
    expect(renderQueryString(search)).toBe('?q={}')
  })

  it('round-trips a standard-encoded value through URLSearchParams', () => {
    configure({ prettyEncoding: false })
    const search = new URLSearchParams()
    search.set('q', 'a&b=c d')
    const rendered = renderQueryString(search)
    expect(new URLSearchParams(rendered).get('q')).toBe('a&b=c d')
    expect(rendered).toBe('?q=a%26b%3Dc+d')
  })
})

describe('createSerializer query encoding', () => {
  it('emits a Slack-safe query when pretty encoding is off', () => {
    configure({ prettyEncoding: false })
    const serialize = createSerializer({
      queries: parseAsJson((value: unknown) => value)
    })
    const rendered = serialize(slackQuery)
    expect(rendered).toBe(standardSlackQuery)
    expect(JSON.parse(new URLSearchParams(rendered).get('queries')!)).toEqual(
      slackQuery.queries
    )
  })

  it('keeps pretty JSON queries when pretty encoding stays on', () => {
    const serialize = createSerializer({
      queries: parseAsJson((value: unknown) => value)
    })
    expect(serialize(slackQuery)).toBe(prettySlackQuery)
  })
})
