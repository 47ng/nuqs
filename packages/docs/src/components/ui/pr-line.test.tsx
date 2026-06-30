import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PullRequestLine } from './pr-line.tsx'

function endpoint(number: number | string) {
  return `https://api.github.com/repos/47ng/nuqs/pulls/${number}`
}

function pull(overrides: Record<string, unknown> = {}) {
  return {
    title: 'feat: add a feature',
    state: 'open',
    draft: false,
    merged: false,
    html_url: 'https://github.com/47ng/nuqs/pull/1',
    user: {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    ...overrides
  }
}

async function render(number: number | string) {
  const element = await PullRequestLine({ number })
  return renderToStaticMarkup(element)
}

describe('PullRequestLine', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('strips the conventional-commit prefix (with scope) from the title', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json(pull({ title: 'fix(core): handle empty values' }))
      )
    )
    const html = await render(1)
    expect(html).toContain('handle empty values')
    expect(html).not.toContain('fix(core)')
  })

  it('renders the author login and a link to their profile', async () => {
    server.use(
      http.get(endpoint(1), () => HttpResponse.json(pull({ user: { login: 'franky47', avatar_url: 'https://example.com/a.png' } })))
    )
    const html = await render(1)
    expect(html).toContain('franky47')
    expect(html).toContain('https://github.com/franky47')
  })

  it('classifies a merged PR ahead of its open/closed state', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json(pull({ merged: true, state: 'closed', draft: false }))
      )
    )
    const html = await render(1)
    expect(html).toContain('merged PR')
  })

  it('classifies a draft PR ahead of its open state', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json(pull({ merged: false, draft: true, state: 'open' }))
      )
    )
    const html = await render(1)
    expect(html).toContain('draft PR')
  })

  it('classifies an open PR', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json(pull({ merged: false, draft: false, state: 'open' }))
      )
    )
    const html = await render(1)
    expect(html).toContain('open PR')
  })

  it('classifies a closed (unmerged) PR', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json(pull({ merged: false, draft: false, state: 'closed' }))
      )
    )
    const html = await render(1)
    expect(html).toContain('closed PR')
  })

  it('renders a fallback message on a non-ok response without throwing', async () => {
    server.use(
      http.get(endpoint(42), () =>
        HttpResponse.json({}, { status: 404, statusText: 'Not Found' })
      )
    )
    const html = await render(42)
    expect(html).toContain('Failed to fetch details')
    expect(html).toContain('404')
    expect(html).toContain('42')
  })

  it('throws when an ok response fails schema validation', async () => {
    server.use(
      http.get(endpoint(1), () =>
        HttpResponse.json({ title: 'no user field', state: 'open', draft: false, merged: false, html_url: 'https://github.com/47ng/nuqs/pull/1' })
      )
    )
    await expect(PullRequestLine({ number: 1 })).rejects.toThrow()
  })
})
