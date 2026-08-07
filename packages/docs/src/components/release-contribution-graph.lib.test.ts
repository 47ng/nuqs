import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import {
  fetchGitHubReleases,
  isBetaVersion,
  processReleases
} from './release-contribution-graph.lib.ts'

const endpoint = 'https://api.github.com/repos/47ng/nuqs/releases'

describe('isBetaVersion', () => {
  it('flags beta, alpha and rc tags', () => {
    expect(isBetaVersion('v2.0.0-beta.1')).toBe(true)
    expect(isBetaVersion('v2.0.0-alpha.3')).toBe(true)
    expect(isBetaVersion('v2.0.0-rc.2')).toBe(true)
  })

  it('does not flag a stable tag', () => {
    expect(isBetaVersion('v2.0.0')).toBe(false)
  })
})

describe('processReleases', () => {
  const releases = [
    { tag_name: 'v2.0.0', published_at: '2024-03-15T10:00:00Z' },
    { tag_name: 'v2.0.1', published_at: '2024-03-15T12:00:00Z' },
    { tag_name: 'v2.1.0-beta.1', published_at: '2024-04-01T10:00:00Z' },
    { tag_name: 'v1.0.0', published_at: '2023-12-31T10:00:00Z' }
  ]

  it('marks stable release days at level 2 and groups same-day versions', () => {
    const { activities, releasesByDate } = processReleases(releases, 2024)
    const stableDay = activities.find(a => a.date === '2024-03-15')
    expect(stableDay).toMatchObject({ count: 1, level: 2 })
    expect(releasesByDate['2024-03-15']).toEqual(['v2.0.0', 'v2.0.1'])
  })

  it('marks a day with both a stable and a beta release as stable (level 2)', () => {
    const { activities, releasesByDate } = processReleases(
      [
        { tag_name: 'v2.0.0', published_at: '2024-05-01T10:00:00Z' },
        { tag_name: 'v2.1.0-beta.1', published_at: '2024-05-01T12:00:00Z' }
      ],
      2024
    )
    expect(activities.find(a => a.date === '2024-05-01')).toMatchObject({
      count: 1,
      level: 2
    })
    expect(releasesByDate['2024-05-01']).toEqual(['v2.0.0', 'v2.1.0-beta.1'])
  })

  it('marks beta-only release days at level 1', () => {
    const { activities, releasesByDate } = processReleases(releases, 2024)
    const betaDay = activities.find(a => a.date === '2024-04-01')
    expect(betaDay).toMatchObject({ count: 1, level: 1 })
    expect(releasesByDate['2024-04-01']).toEqual(['v2.1.0-beta.1'])
  })

  it('leaves non-release days idle and excludes other years', () => {
    const { activities, releasesByDate } = processReleases(releases, 2024)
    expect(activities.find(a => a.date === '2024-06-01')).toMatchObject({
      count: 0,
      level: 0
    })
    expect(releasesByDate['2023-12-31']).toBeUndefined()
    // 2024 is a leap year: 366 daily activities.
    expect(activities).toHaveLength(366)
  })
})

describe('fetchGitHubReleases', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  function release(i: number) {
    return { tag_name: `v${i}`, published_at: '2024-01-01T00:00:00Z' }
  }

  it('returns the releases from a single short page', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([release(1), release(2)]))
    )
    const releases = await fetchGitHubReleases()
    expect(releases.map(r => r.tag_name)).toEqual(['v1', 'v2'])
  })

  it('concatenates across pages until a short page', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => release(i))
    server.use(
      http.get(endpoint, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        return HttpResponse.json(page === '1' ? fullPage : [release(999)])
      })
    )
    const releases = await fetchGitHubReleases()
    expect(releases).toHaveLength(101)
    expect(releases.at(-1)?.tag_name).toBe('v999')
  })

  it('stops paginating on an empty page', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => release(i))
    server.use(
      http.get(endpoint, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        return HttpResponse.json(page === '1' ? fullPage : [])
      })
    )
    const releases = await fetchGitHubReleases()
    expect(releases).toHaveLength(100)
  })

  it('throws on a non-ok response', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({}, { status: 500 })))
    await expect(fetchGitHubReleases()).rejects.toThrow(/GitHub API error: 500/)
  })

  it('throws when the response fails schema validation', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([{ tag_name: 'v1' }]))
    )
    await expect(fetchGitHubReleases()).rejects.toThrow()
  })
})
