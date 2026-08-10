import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderToStaticMarkup } from 'react-dom/server'
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
import { PullRequestLine } from './pr-line.tsx'

function endpoint(number: number | string) {
  return `https://api.github.com/repos/47ng/nuqs/pulls/${number}`
}

const pullDefaults = {
  title: 'feat: add a feature',
  state: 'open',
  draft: false,
  merged: false,
  html_url: 'https://github.com/47ng/nuqs/pull/1',
  user: {
    login: 'octocat',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4'
  }
}

// Keys constrained to the fixture shape so a typo'd override is a compile error.
function pull(
  overrides: Partial<Record<keyof typeof pullDefaults, unknown>> = {}
) {
  return { ...pullDefaults, ...overrides }
}

async function render(number: number | string) {
  const element = await PullRequestLine({ number })
  return renderToStaticMarkup(element)
}

describe('PullRequestLine', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  beforeEach(() => vi.stubEnv('GITHUB_TOKEN', 'test-token'))
  afterEach(() => {
    server.resetHandlers()
    vi.unstubAllEnvs()
  })
  afterAll(() => server.close())

  it('sends the token as an Authorization header when set', async () => {
    let auth: string | null = null
    server.use(
      http.get(endpoint(1), ({ request }) => {
        auth = request.headers.get('authorization')
        return HttpResponse.json(pull())
      })
    )
    await render(1)
    expect(auth).toBe('bearer test-token')
  })

  it('makes anonymous requests without a GitHub token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    let auth: string | null = 'unset'
    server.use(
      http.get(endpoint(1), ({ request }) => {
        auth = request.headers.get('authorization')
        return HttpResponse.json(pull())
      })
    )
    await render(1)
    expect(auth).toBeNull()
  })

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
      http.get(endpoint(1), () =>
        HttpResponse.json(
          pull({
            user: { login: 'franky47', avatar_url: 'https://example.com/a.png' }
          })
        )
      )
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
        HttpResponse.json(
          pull({ merged: false, draft: false, state: 'closed' })
        )
      )
    )
    const html = await render(1)
    expect(html).toContain('closed PR')
  })

  it('degrades to a plain GitHub link when rate limited', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    server.use(
      http.get(endpoint(42), () => HttpResponse.json({}, { status: 403 }))
    )
    const html = await render(42)
    expect(html).toContain('https://github.com/47ng/nuqs/pull/42')
    expect(html).toContain('View on GitHub')
    expect(html).not.toContain('Failed to fetch details')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('GitHub rate limit reached (403)')
    )
    warn.mockRestore()
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
        HttpResponse.json({
          title: 'no user field',
          state: 'open',
          draft: false,
          merged: false,
          html_url: 'https://github.com/47ng/nuqs/pull/1'
        })
      )
    )
    await expect(PullRequestLine({ number: 1 })).rejects.toThrow()
  })
})
