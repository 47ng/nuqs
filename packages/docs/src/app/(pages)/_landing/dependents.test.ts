import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fetchDependents } from './dependents.tsx'

const endpoint = 'https://dependents.47ng.com'

function dependent(overrides: Record<string, unknown> = {}) {
  return {
    stars: 1200,
    owner: 'acme',
    name: 'webapp',
    pkg: 'nuqs',
    avatarURL: 'https://avatars.githubusercontent.com/u/1?v=4',
    version: '2.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

describe('fetchDependents', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('parses the dependents array and coerces createdAt to a Date', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([
          dependent({ owner: 'a', name: 'one' }),
          dependent({ owner: 'b', name: 'two', version: null, pkg: 'next-usequerystate' })
        ])
      )
    )
    const dependents = await fetchDependents()
    expect(dependents).toHaveLength(2)
    expect(dependents[0].createdAt).toBeInstanceOf(Date)
    expect(dependents[1].version).toBeNull()
  })

  it('rejects a payload with missing fields', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([{ owner: 'a', name: 'one' }])
      )
    )
    await expect(fetchDependents()).rejects.toThrow()
  })

  it('rejects a payload with wrong field types', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([dependent({ stars: 'lots' })])
      )
    )
    await expect(fetchDependents()).rejects.toThrow()
  })
})
