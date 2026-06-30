import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fetchContributors } from './contributors.tsx'

const endpoint = 'https://api.github.com/repos/47ng/nuqs/contributors'

function contributor(overrides: Record<string, unknown> = {}) {
  return {
    login: 'octocat',
    html_url: 'https://github.com/octocat',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    type: 'User',
    contributions: 10,
    ...overrides
  }
}

describe('fetchContributors', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('returns human contributors sorted by contributions descending', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([
          contributor({ login: 'low', contributions: 3 }),
          contributor({ login: 'high', contributions: 99 }),
          contributor({ login: 'mid', contributions: 42 })
        ])
      )
    )
    const contributors = await fetchContributors()
    expect(contributors.map(c => c.login)).toEqual(['high', 'mid', 'low'])
  })

  it('filters bots by type, known bot id, and [bot] suffix', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([
          contributor({ login: 'human', contributions: 50 }),
          contributor({ login: 'some-bot', type: 'Bot', contributions: 40 }),
          contributor({ login: 'dependabot[bot]', contributions: 30 }),
          contributor({ login: 'Renovate[bot]', contributions: 20 }),
          contributor({ login: 'custom[bot]', contributions: 10 })
        ])
      )
    )
    const contributors = await fetchContributors()
    expect(contributors.map(c => c.login)).toEqual(['human'])
  })

  it('paginates until a page returns fewer than the page size', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) =>
      contributor({ login: `p1-${i}`, contributions: 1000 - i })
    )
    const page2 = [contributor({ login: 'last', contributions: 1 })]
    server.use(
      http.get(endpoint, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        return HttpResponse.json(page === '1' ? page1 : page2)
      })
    )
    const contributors = await fetchContributors()
    expect(contributors).toHaveLength(101)
    expect(contributors.at(-1)?.login).toBe('last')
  })

  it('throws on a non-ok response', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({}, { status: 500, statusText: 'Server Error' })
      )
    )
    await expect(fetchContributors()).rejects.toThrow(/500 Server Error/)
  })

  it('throws when the response fails schema validation', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([{ login: 'octocat' }]) // missing required fields
      )
    )
    await expect(fetchContributors()).rejects.toThrow()
  })
})
