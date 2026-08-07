import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { sendEmail } from './mailpace.ts'

const endpoint = 'https://app.mailpace.com/api/v1/send'

const email = {
  from: 'release-bot@example.com',
  to: 'maintainer@example.com',
  subject: '[nuqs] test',
  textbody: 'Body of the email',
  tags: ['nuqs']
}

describe('sendEmail', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('posts the email to the MailPace API with the auth token in the header', async () => {
    let captured:
      | { token: string | null; contentType: string | null; body: unknown }
      | undefined
    server.use(
      http.post(endpoint, async ({ request }) => {
        captured = {
          token: request.headers.get('MailPace-Server-Token'),
          contentType: request.headers.get('Content-Type'),
          body: await request.json()
        }
        return HttpResponse.json({ id: 1, status: 'pending' })
      })
    )
    await sendEmail('api-token-123', email)
    expect(captured).toEqual({
      token: 'api-token-123',
      contentType: 'application/json',
      body: email
    })
  })

  it('throws with the status and error detail when the API rejects the request', async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json({ error: 'Invalid API Token' }, { status: 400 })
      )
    )
    await expect(sendEmail('bad-token', email)).rejects.toThrow(
      /400.*Invalid API Token/
    )
  })
})
