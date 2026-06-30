import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

vi.mock('server-only', () => ({}))

import { getStarHistory } from './github.ts'

const endpoint = 'https://api.github.com/graphql'

function edge(login: string, starredAt: string) {
  return {
    starredAt,
    node: {
      login,
      name: null,
      avatarUrl: `https://avatars.githubusercontent.com/${login}`,
      company: null,
      followers: { totalCount: 0 }
    }
  }
}

function page(
  edges: ReturnType<typeof edge>[],
  {
    totalCount = 100,
    hasNextPage = false,
    endCursor = null as string | null
  } = {}
) {
  return {
    data: {
      repository: {
        stargazers: {
          totalCount,
          pageInfo: { hasNextPage, endCursor },
          edges
        }
      }
    }
  }
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Pin "today" to a fixed UTC day so the 12-day window is deterministic.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('getStarHistory', () => {
  it('fills the 12-day bins and computes end-of-day star totals', async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json(
          page(
            [
              edge('a', '2024-06-15T10:00:00Z'),
              edge('b', '2024-06-15T11:00:00Z'),
              edge('c', '2024-06-14T09:00:00Z')
            ],
            { totalCount: 100 }
          )
        )
      )
    )
    const history = await getStarHistory()
    expect(history.count).toBe(100)
    expect(history.bins).toHaveLength(12)
    expect(history.bins[0]).toMatchObject({
      date: '2024-06-15',
      diff: 2,
      stars: 100
    })
    expect(history.bins[0].stargarzers.map(s => s.login)).toEqual(['a', 'b'])
    // 06-14 earned 1 star; end-of-day total is the prior day minus its diff.
    expect(history.bins[1]).toMatchObject({
      date: '2024-06-14',
      diff: 1,
      stars: 98
    })
  })

  it('follows the cursor across pages until the window is exhausted', async () => {
    server.use(
      http.post(endpoint, async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.includes('"c1"')) {
          return HttpResponse.json(
            page([
              edge('p2a', '2024-06-13T10:00:00Z'),
              edge('old', '2024-06-01T10:00:00Z') // before the window
            ])
          )
        }
        return HttpResponse.json(
          page(
            [
              edge('p1a', '2024-06-15T10:00:00Z'),
              edge('p1b', '2024-06-14T10:00:00Z')
            ],
            { hasNextPage: true, endCursor: 'c1' }
          )
        )
      })
    )
    const history = await getStarHistory()
    // p2a only appears if the second page was fetched via the cursor.
    expect(history.bins[0].stargarzers.map(s => s.login)).toEqual(['p1a'])
    expect(history.bins[1].stargarzers.map(s => s.login)).toEqual(['p1b'])
    expect(history.bins[2].stargarzers.map(s => s.login)).toEqual(['p2a'])
  })

  it('terminates on an empty page', async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json(
          page([], { totalCount: 50, hasNextPage: true, endCursor: 'c1' })
        )
      )
    )
    const history = await getStarHistory()
    expect(history.count).toBe(50)
    expect(history.bins).toHaveLength(12)
    expect(history.bins.every(b => b.diff === 0)).toBe(true)
    expect(history.bins[0].stars).toBe(50)
  })

  it('returns empty bins with the total count when nothing was starred in the window', async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json(
          page([edge('old', '2024-05-01T10:00:00Z')], { totalCount: 200 })
        )
      )
    )
    const history = await getStarHistory()
    expect(history.count).toBe(200)
    expect(history.bins[0]).toMatchObject({ stars: 200, diff: 0 })
    expect(history.bins.every(b => b.stargarzers.length === 0)).toBe(true)
  })

  it('throws on a malformed GraphQL response', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json({ data: {} })))
    await expect(getStarHistory()).rejects.toThrow()
  })

  it('throws on a non-ok API response', async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json({}, { status: 500, statusText: 'Server Error' })
      )
    )
    await expect(getStarHistory()).rejects.toThrow(/GitHub API error: 500/)
  })
})
