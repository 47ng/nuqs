import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { after, NextResponse } from 'next/server'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi
} from 'vitest'

vi.mock('next/server', async importOriginal => {
  const original = await importOriginal<typeof import('next/server')>()
  return { ...original, after: vi.fn() }
})

const endpoint = 'https://ingest.usenotra.com/api/geo/ingest'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

beforeEach(() => {
  vi.resetModules()
  vi.mocked(after).mockClear()
})

afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})

it('defers tracking and keeps the send alive without changing the response', async () => {
  vi.stubEnv('NOTRA_GEO_TOKEN', 'test-token')
  let finishSend!: () => void
  const send = new Promise<void>(resolve => {
    finishSend = resolve
  })
  const onRequest = vi.fn()
  server.use(
    http.post(endpoint, async ({ request }) => {
      onRequest(request)
      await send
      return new HttpResponse(null, { status: 204 })
    })
  )
  const { proxy } = await import('./proxy')
  const request = new Request('https://nuqs.dev/docs/installation', {
    headers: { 'user-agent': 'GPTBot' }
  })

  const response = proxy(request)

  expect(response.status).toBe(NextResponse.next().status)
  expect(response.headers.get('x-middleware-next')).toBe('1')
  expect(onRequest).not.toHaveBeenCalled()
  expect(after).toHaveBeenCalledOnce()

  const callback = vi.mocked(after).mock.calls[0]![0]
  expect(callback).toBeTypeOf('function')
  if (typeof callback !== 'function')
    throw new Error('Expected an after callback')
  await callback()

  try {
    await vi.waitFor(() => expect(onRequest).toHaveBeenCalledOnce())
    const capturedRequest: Request = onRequest.mock.calls[0]![0]
    expect(capturedRequest.headers.get('authorization')).toBe(
      'Bearer test-token'
    )
    expect(await capturedRequest.json()).toMatchObject({
      url: request.url,
      userAgent: 'GPTBot'
    })
    expect(after).toHaveBeenCalledTimes(2)
    const pending = vi.mocked(after).mock.calls[1]![0]
    expect(pending).toBeInstanceOf(Promise)
    const onSettled = vi.fn()
    void Promise.resolve(pending).then(onSettled)
    await Promise.resolve()
    expect(onSettled).not.toHaveBeenCalled()
    finishSend()
    await pending
    expect(onSettled).toHaveBeenCalledOnce()
  } finally {
    finishSend()
  }
})

it('serves requests without a token and sends no analytics', async () => {
  vi.stubEnv('NOTRA_GEO_TOKEN', undefined)
  const onRequest = vi.fn(() => new HttpResponse(null, { status: 204 }))
  server.use(http.post(endpoint, onRequest))
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
  await vi.mocked(after).mock.calls[1]![0]
  expect(onRequest).not.toHaveBeenCalled()
})
