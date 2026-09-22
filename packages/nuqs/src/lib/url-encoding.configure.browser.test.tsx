import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from '../adapters/testing'
import { parseAsJson } from '../parsers'
import { useQueryState } from '../useQueryState'
import { configure } from './url-encoding'

const slackQuery = [{ query: 'http_request_errors{service="foo"}' }]
const standardSlackQuery =
  '?queries=%5B%7B%22query%22%3A%22http_request_errors%7Bservice%3D%5C%22foo%5C%22%7D%22%7D%5D'

afterEach(() => {
  configure({ prettyEncoding: true })
})

describe('useQueryState query encoding', () => {
  it('writes a URLSearchParams query when pretty encoding is off', async () => {
    configure({ prettyEncoding: false })
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryState(
          'queries',
          parseAsJson((value: unknown) => value)
        ),
      { wrapper: withNuqsTestingAdapter({ onUrlUpdate }) }
    )

    await act(() => {
      result.current[1](slackQuery)
    })

    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(standardSlackQuery)
  })
})
