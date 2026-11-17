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

const graphqlEndpoint = 'https://api.github.com/graphql'
const historyEndpoint =
  'https://api.github.com/repos/47ng/nuqs/stargazers/history'

type Week = { week: number; total: number; days: number[] }

function week(sunday: string, days: number[]): Week {
  return {
    week: Date.parse(sunday) / 1000,
    total: days.reduce((sum, day) => sum + day, 0),
    days
  }
}

function mockGitHub({ stargazerCount = 100, weeks = [] as Week[] } = {}) {
  server.use(
    http.post(graphqlEndpoint, () =>
      HttpResponse.json({ data: { repository: { stargazerCount } } })
    ),
    http.get(historyEndpoint, ({ request }) => {
      const perPage = new URL(request.url).searchParams.get('per_page') ?? 30
      return HttpResponse.json(weeks.slice(0, Number(perPage)))
    })
  )
}

async function getAvailableStarHistory() {
  const history = await getStarHistory()
  if (history === null) {
    throw new Error('Expected star history to be available')
  }
  return history
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Pin "today" to Saturday 2024-06-15 (UTC): the 12-day window is [06-04 .. 06-15].
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  vi.stubEnv('GITHUB_TOKEN', 'test-token')
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('getStarHistory', () => {
  it('returns null and warns without a GitHub token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await getStarHistory()).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      'GITHUB_TOKEN is not set: star history is unavailable.'
    )
  })

  it('fills the 12-day bins and computes end-of-day star totals', async () => {
    mockGitHub({
      stargazerCount: 100,
      weeks: [week('2024-06-09', [0, 0, 0, 0, 0, 1, 2])]
    })
    const history = await getAvailableStarHistory()
    expect(history.count).toBe(100)
    expect(history.bins).toHaveLength(12)
    expect(history.bins[0]).toEqual({ date: '2024-06-15', diff: 2, stars: 100 })
    // 06-14 earned 1 star; end-of-day total is the next day minus its diff.
    expect(history.bins[1]).toEqual({ date: '2024-06-14', diff: 1, stars: 98 })
    expect(history.bins[2]).toEqual({ date: '2024-06-13', diff: 0, stars: 97 })
  })

  it('maps each week day to its date, Sunday first, across weeks', async () => {
    mockGitHub({
      weeks: [
        week('2024-06-09', [1, 0, 0, 0, 0, 0, 0]),
        week('2024-06-02', [3, 0, 0, 0, 0, 0, 4])
      ]
    })
    const history = await getAvailableStarHistory()
    const diffs = Object.fromEntries(history.bins.map(b => [b.date, b.diff]))
    expect(diffs['2024-06-09']).toBe(1)
    expect(diffs['2024-06-08']).toBe(4)
  })

  it('includes the oldest in-window day and excludes the day before it', async () => {
    // Window is [06-15 .. 06-04]: Tuesday 06-04 is bins[11], Monday 06-03 is out.
    mockGitHub({ weeks: [week('2024-06-02', [0, 5, 7, 0, 0, 0, 0])] })
    const history = await getAvailableStarHistory()
    expect(history.bins[11]).toMatchObject({ date: '2024-06-04', diff: 7 })
    expect(history.bins.reduce((sum, b) => sum + b.diff, 0)).toBe(7)
  })

  it.each([
    ['UTC+2', '2024-06-08T22:00:00Z'],
    ['UTC-8', '2024-06-09T08:00:00Z'],
    ['UTC+14', '2024-06-08T10:00:00Z']
  ])(
    'aligns weeks starting on Sunday 06-09 in %s to that Sunday',
    async (_, weekStart) => {
      mockGitHub({
        weeks: [
          {
            week: Date.parse(weekStart) / 1000,
            total: 1,
            days: [1, 0, 0, 0, 0, 0, 0]
          }
        ]
      })
      const history = await getAvailableStarHistory()
      expect(history.bins.find(b => b.diff > 0)?.date).toBe('2024-06-09')
    }
  )

  it('covers the 12-day window when today is a Sunday', async () => {
    // Window is [06-05 .. 06-16], over three weeks.
    vi.setSystemTime(new Date('2024-06-16T12:00:00Z'))
    mockGitHub({
      weeks: [
        week('2024-06-16', [1, 0, 0, 0, 0, 0, 0]),
        week('2024-06-09', [0, 0, 0, 0, 0, 0, 0]),
        week('2024-06-02', [0, 0, 0, 3, 0, 0, 0])
      ]
    })
    const history = await getAvailableStarHistory()
    expect(history.bins[0]).toMatchObject({ date: '2024-06-16', diff: 1 })
    expect(history.bins[11]).toMatchObject({ date: '2024-06-05', diff: 3 })
  })

  it('authenticates with the token and pins the API version', async () => {
    const headers: Record<string, string | null> = {}
    mockGitHub()
    server.use(
      http.get(historyEndpoint, ({ request }) => {
        headers.authorization = request.headers.get('authorization')
        headers.apiVersion = request.headers.get('x-github-api-version')
        return HttpResponse.json([])
      })
    )
    await getAvailableStarHistory()
    expect(headers).toEqual({
      authorization: 'Bearer test-token',
      apiVersion: '2026-03-10'
    })
  })

  it('returns empty bins with the total count when nothing was starred in the window', async () => {
    mockGitHub({ stargazerCount: 200, weeks: [] })
    const history = await getAvailableStarHistory()
    expect(history.count).toBe(200)
    expect(history.bins).toHaveLength(12)
    expect(history.bins.every(b => b.diff === 0 && b.stars === 200)).toBe(true)
  })

  it('returns null when GitHub cannot return the repository', async () => {
    mockGitHub()
    server.use(
      http.post(graphqlEndpoint, () =>
        HttpResponse.json({
          data: { repository: null },
          errors: [{ message: 'Repository data is unavailable' }]
        })
      ),
      http.get(historyEndpoint, () =>
        HttpResponse.json({}, { status: 404, statusText: 'Not Found' })
      )
    )
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await getStarHistory()).toBeNull()
    expect(error).toHaveBeenCalledWith(
      new Error('GitHub API error: Repository data is unavailable')
    )
  })

  it('throws on a malformed GraphQL response', async () => {
    mockGitHub()
    server.use(
      http.post(graphqlEndpoint, () => HttpResponse.json({ data: {} }))
    )
    await expect(getStarHistory()).rejects.toThrow()
  })

  it('throws on a malformed history response', async () => {
    mockGitHub()
    server.use(
      http.get(historyEndpoint, () => HttpResponse.json([{ week: 'nope' }]))
    )
    await expect(getStarHistory()).rejects.toThrow()
  })

  it('throws on a non-ok GraphQL response', async () => {
    mockGitHub()
    server.use(
      http.post(graphqlEndpoint, () =>
        HttpResponse.json({}, { status: 500, statusText: 'Server Error' })
      )
    )
    await expect(getStarHistory()).rejects.toThrow(/GitHub API error: 500/)
  })

  it('throws on a non-ok history response', async () => {
    mockGitHub()
    server.use(
      http.get(historyEndpoint, () =>
        HttpResponse.json({}, { status: 502, statusText: 'Bad Gateway' })
      )
    )
    await expect(getStarHistory()).rejects.toThrow(/GitHub API error: 502/)
  })
})
