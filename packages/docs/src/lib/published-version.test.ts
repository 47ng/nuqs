import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  getPublishedVersion,
  isPublished,
  isReleased
} from './published-version.ts'

describe('isReleased', () => {
  it('is true when the introduced version equals the published version', () => {
    expect(isReleased('2.9.0', '2.9.0')).toBe(true)
  })

  it('is false when the introduced version is newer than the published one', () => {
    expect(isReleased('2.9.0', '2.8.0')).toBe(false)
  })

  it('is true when the introduced version is older than the published one', () => {
    expect(isReleased('2.4.0', '2.9.0')).toBe(true)
  })

  it('compares numerically, not lexically (2.10.0 is newer than 2.9.0)', () => {
    expect(isReleased('2.10.0', '2.9.0')).toBe(false)
    expect(isReleased('2.9.0', '2.10.0')).toBe(true)
  })

  it('compares the patch segment', () => {
    expect(isReleased('2.9.1', '2.9.0')).toBe(false)
    expect(isReleased('2.9.0', '2.9.1')).toBe(true)
  })
})

describe('isPublished', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('gates unreleased content in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(isPublished('2.9.0', '2.8.0')).toBe(false)
  })

  it('shows unreleased content on preview deployments', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(isPublished('2.9.0', '2.8.0')).toBe(true)
  })

  it('shows unreleased content on local dev (VERCEL_ENV unset)', () => {
    vi.stubEnv('VERCEL_ENV', undefined)
    expect(isPublished('2.9.0', '2.8.0')).toBe(true)
  })

  it('still shows released content in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(isPublished('2.4.0', '2.9.0')).toBe(true)
  })
})

describe('getPublishedVersion', () => {
  const registry = 'https://registry.npmjs.org/nuqs'
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('returns the latest dist-tag from the npm registry', async () => {
    server.use(
      http.get(registry, () =>
        HttpResponse.json({ 'dist-tags': { latest: '2.8.9' } })
      )
    )
    await expect(getPublishedVersion()).resolves.toBe('2.8.9')
  })

  it('throws on a non-ok registry response (fail loud)', async () => {
    server.use(
      http.get(registry, () =>
        HttpResponse.json({}, { status: 503, statusText: 'Service Unavailable' })
      )
    )
    await expect(getPublishedVersion()).rejects.toThrow(/npm/i)
  })

  it('throws when the response is missing dist-tags.latest (fail loud)', async () => {
    server.use(http.get(registry, () => HttpResponse.json({ 'dist-tags': {} })))
    await expect(getPublishedVersion()).rejects.toThrow(/dist-tags\.latest/)
  })
})
