import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getGitHubActionsStatus } from './gha-status.tsx'

const endpoint = 'https://api.github.com/graphql'

function run(id: string, status: string, conclusion: string | null = 'SUCCESS') {
  return {
    id,
    url: `https://github.com/47ng/nuqs/actions/runs/${id}`,
    createdAt: '2024-01-01T00:00:00Z',
    checkSuite: { status, conclusion }
  }
}

function respondWith(nodes: unknown[]) {
  return http.post(endpoint, () =>
    HttpResponse.json({ data: { node: { runs: { nodes } } } })
  )
}

describe('getGitHubActionsStatus', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('keeps the last 5 completed runs, ordered oldest to newest', async () => {
    // API returns newest-first; n2 and n8 are not completed and must drop out.
    server.use(
      respondWith([
        run('n1', 'COMPLETED'),
        run('n2', 'IN_PROGRESS', null),
        run('n3', 'COMPLETED'),
        run('n4', 'COMPLETED'),
        run('n5', 'COMPLETED'),
        run('n6', 'COMPLETED'),
        run('n7', 'COMPLETED'),
        run('n8', 'PENDING', null)
      ])
    )
    const statuses = await getGitHubActionsStatus()
    // Newest 5 completed are n1,n3,n4,n5,n6 → reversed to oldest-first.
    expect(statuses.map(s => s.id)).toEqual(['n6', 'n5', 'n4', 'n3', 'n1'])
    expect(statuses.every(s => s.checkSuite.status === 'COMPLETED')).toBe(true)
  })

  it('returns an empty array when there are no completed runs', async () => {
    server.use(respondWith([run('n1', 'IN_PROGRESS', null)]))
    await expect(getGitHubActionsStatus()).resolves.toEqual([])
  })

  it('returns an empty array on a malformed response shape', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json({ data: {} })))
    await expect(getGitHubActionsStatus()).resolves.toEqual([])
  })

  it('returns an empty array on an API error', async () => {
    server.use(http.post(endpoint, () => HttpResponse.error()))
    await expect(getGitHubActionsStatus()).resolves.toEqual([])
  })
})
