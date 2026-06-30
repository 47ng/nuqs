import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { bumpHeadings, fetchReleases } from './_lib.ts'

const releasesEndpoint = 'https://api.github.com/repos/47ng/nuqs/releases'

function release(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    tag_name: 'v2.0.0',
    name: 'nuqs@2.0.0',
    html_url: 'https://github.com/47ng/nuqs/releases/tag/v2.0.0',
    published_at: '2024-01-01T00:00:00Z',
    body: 'Release notes',
    draft: false,
    prerelease: false,
    ...overrides
  }
}

describe('bumpHeadings', () => {
  it('bumps every ATX heading one level deeper', () => {
    expect(bumpHeadings('# Title\n## Features\n### Detail')).toBe(
      '## Title\n### Features\n#### Detail'
    )
  })

  it('leaves non-heading lines untouched', () => {
    expect(bumpHeadings('a line\n#tag-no-space\nmore')).toBe(
      'a line\n#tag-no-space\nmore'
    )
  })

  it('does not bump a # line inside a fenced code block', () => {
    const body = [
      '## Features',
      '',
      '```sh',
      '# install',
      'pnpm add nuqs',
      '```'
    ].join('\n')
    expect(bumpHeadings(body)).toBe(
      ['### Features', '', '```sh', '# install', 'pnpm add nuqs', '```'].join(
        '\n'
      )
    )
  })

  it('handles ~~~ fences too', () => {
    const body = [
      '# Heading',
      '~~~',
      '# not a heading',
      '~~~',
      '## After'
    ].join('\n')
    expect(bumpHeadings(body)).toBe(
      ['## Heading', '~~~', '# not a heading', '~~~', '### After'].join('\n')
    )
  })
})

describe('fetchReleases', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('returns GA releases, filtering out drafts and prereleases', async () => {
    server.use(
      http.get(releasesEndpoint, () =>
        HttpResponse.json([
          release({ id: 1, tag_name: 'v2.0.0' }),
          release({ id: 2, tag_name: 'v2.1.0-beta.1', prerelease: true }),
          release({ id: 3, tag_name: 'v2.1.0-draft', draft: true }),
          release({ id: 4, tag_name: 'v2.1.0' })
        ])
      )
    )
    const releases = await fetchReleases()
    expect(releases.map(r => r.tag_name)).toEqual(['v2.0.0', 'v2.1.0'])
  })

  it('treats missing draft/prerelease flags as GA releases', async () => {
    server.use(
      http.get(releasesEndpoint, () =>
        HttpResponse.json([
          { ...release({ id: 5, tag_name: 'v1.0.0' }), draft: undefined, prerelease: undefined }
        ])
      )
    )
    const releases = await fetchReleases()
    expect(releases).toHaveLength(1)
  })

  it('throws on a non-ok response rather than caching an empty changelog', async () => {
    server.use(
      http.get(releasesEndpoint, () =>
        HttpResponse.json({}, { status: 502, statusText: 'Bad Gateway' })
      )
    )
    await expect(fetchReleases()).rejects.toThrow(/502 Bad Gateway/)
  })

  it('throws when the response body fails schema validation', async () => {
    server.use(
      http.get(releasesEndpoint, () =>
        HttpResponse.json([{ tag_name: 'v2.0.0' }]) // missing required fields
      )
    )
    await expect(fetchReleases()).rejects.toThrow()
  })
})
