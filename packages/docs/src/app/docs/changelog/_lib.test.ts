import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { bumpHeadings, fetchReleases, getChangelogMarkdown } from './_lib.ts'

const releasesEndpoint = 'https://api.github.com/repos/47ng/nuqs/releases'

const releaseDefaults = {
  id: 1,
  tag_name: 'v2.0.0',
  name: 'nuqs@2.0.0',
  html_url: 'https://github.com/47ng/nuqs/releases/tag/v2.0.0',
  published_at: '2024-01-01T00:00:00Z',
  body: 'Release notes',
  draft: false,
  prerelease: false
}

// Keys are constrained to the fixture shape so a typo'd override (e.g. `tagname`)
// is a compile error rather than a silently-ignored, false-green test.
function release(
  overrides: Partial<Record<keyof typeof releaseDefaults, unknown>> = {}
) {
  return { ...releaseDefaults, ...overrides }
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
          release(), // v2.0.0 GA default
          release({ tag_name: 'v2.1.0-beta.1', prerelease: true }),
          release({ tag_name: 'v2.1.0-draft', draft: true }),
          release({ tag_name: 'v2.1.0' })
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
          { ...release(), draft: undefined, prerelease: undefined }
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
      http.get(
        releasesEndpoint,
        () => HttpResponse.json([{ tag_name: 'v2.0.0' }]) // missing required fields
      )
    )
    await expect(fetchReleases()).rejects.toThrow()
  })
})

describe('getChangelogMarkdown', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('renders a section per non-empty release, bumping headings and stripping the DTO', async () => {
    server.use(
      http.get(releasesEndpoint, () =>
        HttpResponse.json([
          release({
            tag_name: 'v2.0.0',
            name: 'nuqs@2.0.0',
            body: '## Features\n\n- A thing<!--\n<changelog:dto>{"x":1}</changelog:dto>\n-->'
          }),
          release({ tag_name: 'v1.9.0', name: null, body: 'Plain notes' }),
          release({ tag_name: 'v1.8.0', body: '   ' }) // whitespace-only → dropped
        ])
      )
    )
    const md = await getChangelogMarkdown()
    expect(md.startsWith('# Changelog')).toBe(true)
    expect(md).toContain('## nuqs@2.0.0') // explicit name
    expect(md).toContain('## v1.9.0') // falls back to tag_name when name is null
    expect(md).toContain('### Features') // headings bumped one level deeper
    expect(md).not.toContain('changelog:dto') // machine DTO comment stripped
    expect(md).toMatch(/Published on \d{4}-\d{2}-\d{2}/)
    expect(md).toContain('[View on GitHub]')
    expect(md).toContain('\n---\n') // section separator between the two kept releases
    expect(md).not.toContain('v1.8.0') // whitespace-only body filtered out
  })
})
