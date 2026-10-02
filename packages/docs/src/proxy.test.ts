import { after, NextResponse } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('next/server', async importOriginal => {
  const original = await importOriginal<typeof import('next/server')>()
  return { ...original, after: vi.fn() }
})

beforeEach(() => {
  vi.resetModules()
  vi.mocked(after).mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('defers tracking and keeps the send alive without changing the response', async () => {
  vi.stubEnv('NOTRA_GEO_TOKEN', 'test-token')
  let finishSend!: (response: Response) => void
  const fetch = vi.fn(
    () =>
      new Promise<Response>(resolve => {
        finishSend = resolve
      })
  )
  vi.stubGlobal('fetch', fetch)
  const { proxy } = await import('./proxy')
  const request = new Request('https://nuqs.dev/docs/installation', {
    headers: { 'user-agent': 'GPTBot' }
  })

  const response = proxy(request)

  expect(response.status).toBe(NextResponse.next().status)
  expect(response.headers.get('x-middleware-next')).toBe('1')
  expect(fetch).not.toHaveBeenCalled()
  expect(after).toHaveBeenCalledOnce()

  const callback = vi.mocked(after).mock.calls[0]![0]
  expect(callback).toBeTypeOf('function')
  if (typeof callback !== 'function')
    throw new Error('Expected an after callback')
  await callback()

  expect(fetch).toHaveBeenCalledWith(
    'https://ingest.usenotra.com/api/geo/ingest',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer test-token' })
    })
  )
  expect(after).toHaveBeenCalledTimes(2)
  const pending = vi.mocked(after).mock.calls[1]![0]
  expect(pending).toBeInstanceOf(Promise)
  finishSend(new Response(null, { status: 204 }))
  await pending
})

it('serves requests without a token and sends no analytics', async () => {
  vi.stubEnv('NOTRA_GEO_TOKEN', undefined)
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const { proxy } = await import('./proxy')

  expect(
    proxy(new Request('https://nuqs.dev/docs/installation')).headers.get(
      'x-middleware-next'
    )
  ).toBe('1')
  const callback = vi.mocked(after).mock.calls[0]![0]
  if (typeof callback !== 'function')
    throw new Error('Expected an after callback')
  await callback()
  expect(fetch).not.toHaveBeenCalled()
})
