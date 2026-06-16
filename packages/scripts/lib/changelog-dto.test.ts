import { describe, expect, it } from 'vitest'
import {
  CHANGELOG_DTO_SCHEMA_URL,
  type Change,
  type ChangelogDTO,
  type ReleaseChanges,
  groupChangesByCategory,
  parseChangelogComment,
  parseCodeSpans,
  renderChangelogComment,
  stripChangelogComment,
  toChangelogDTO
} from './changelog-dto.ts'

// A full release payload exercising both change variants. The DTO is this exact
// shape plus a `$schema` tag — domain and wire no longer diverge.
const release: ReleaseChanges = {
  changes: [
    {
      source: 'squashedPR',
      prNumber: 1450,
      type: 'feat',
      breaking: true,
      description: 'return null on invalid parser input',
      author: 'franky47',
      closingIssues: [1442, 1443]
    },
    {
      source: 'directCommit',
      sha: 'a1b2c3d4',
      type: null,
      breaking: false,
      description: 'fix typo in funding link',
      author: 'François Best'
    }
  ],
  contributors: ['contributorA', 'contributorB']
}

const expectedDto: ChangelogDTO = {
  $schema: CHANGELOG_DTO_SCHEMA_URL,
  ...release
}

describe('parseCodeSpans', () => {
  it('returns no segments for an empty string', () => {
    expect(parseCodeSpans('')).toEqual([])
  })

  it('returns a single text segment when there are no backticks', () => {
    expect(parseCodeSpans('plain title')).toEqual([
      { code: false, value: 'plain title' }
    ])
  })

  it('splits a balanced backtick pair into a code segment', () => {
    expect(parseCodeSpans('Add `useQueryState` hook')).toEqual([
      { code: false, value: 'Add ' },
      { code: true, value: 'useQueryState' },
      { code: false, value: ' hook' }
    ])
  })

  it('handles multiple code spans', () => {
    expect(parseCodeSpans('Replace `foo` with `bar`')).toEqual([
      { code: false, value: 'Replace ' },
      { code: true, value: 'foo' },
      { code: false, value: ' with ' },
      { code: true, value: 'bar' }
    ])
  })

  it('handles code at the start and end', () => {
    expect(parseCodeSpans('`nuqs` rocks `hard`')).toEqual([
      { code: true, value: 'nuqs' },
      { code: false, value: ' rocks ' },
      { code: true, value: 'hard' }
    ])
  })

  it('leaves a lone (unbalanced) backtick as literal text', () => {
    expect(parseCodeSpans('a lone ` backtick')).toEqual([
      { code: false, value: 'a lone ` backtick' }
    ])
  })
})

describe('toChangelogDTO', () => {
  it('wraps a ReleaseChanges with the $schema tag (no per-change projection)', () => {
    expect(toChangelogDTO(release)).toEqual(expectedDto)
  })
})

describe('renderChangelogComment / parseChangelogComment round-trip', () => {
  it('serializes to one HTML comment and parses back to an equal DTO', () => {
    const comment = renderChangelogComment(release)
    expect(comment.startsWith('<!--')).toBe(true)
    expect(comment.trimEnd().endsWith('-->')).toBe(true)
    const parsed = parseChangelogComment(comment)
    expect(parsed).toEqual({ preamble: null, dto: expectedDto })
  })

  it('round-trips when the comment is embedded in a larger release body', () => {
    const body = `## Features\n\n- #1450 - return null\n\n${renderChangelogComment(release)}`
    expect(parseChangelogComment(body)).toEqual({
      preamble: null,
      dto: expectedDto
    })
  })

  it('emits an empty preamble stub with the guiding hint line', () => {
    const comment = renderChangelogComment(release)
    expect(comment).toContain('<changelog:preamble></changelog:preamble>')
    expect(comment).toContain("docs' changelog page")
  })
})

describe('escaping', () => {
  it('round-trips a description containing the comment terminator without producing a literal "-->"', () => {
    const evil: ReleaseChanges = {
      changes: [
        {
          source: 'directCommit',
          sha: 'deadbeef',
          type: null,
          breaking: false,
          description: 'guard against `-->` early termination',
          author: 'Tester'
        }
      ],
      contributors: []
    }
    const comment = renderChangelogComment(evil)
    // The only "-->" in the whole comment is the closing terminator (last 3 chars).
    expect(comment.indexOf('-->')).toBe(comment.length - 3)
    const parsed = parseChangelogComment(comment)
    expect(parsed?.dto.changes[0]).toMatchObject({
      description: 'guard against `-->` early termination'
    })
  })

  it('round-trips a description containing a literal closing DTO tag', () => {
    const evil: ReleaseChanges = {
      changes: [
        {
          source: 'directCommit',
          sha: 'cafed00d',
          type: null,
          breaking: false,
          description: 'parser must survive </changelog:dto> in prose',
          author: 'Tester'
        }
      ],
      contributors: []
    }
    const parsed = parseChangelogComment(renderChangelogComment(evil))
    expect(parsed?.dto.changes[0]).toMatchObject({
      description: 'parser must survive </changelog:dto> in prose'
    })
  })

  it('keeps backticks literal (raw) in the DTO, never rendering presentation HTML', () => {
    const withCode: ReleaseChanges = {
      changes: [
        {
          source: 'directCommit',
          sha: '0badf00d',
          type: null,
          breaking: false,
          description: 'backticks `demo` stay raw',
          author: 'Tester'
        }
      ],
      contributors: []
    }
    const comment = renderChangelogComment(withCode)
    expect(comment).not.toContain('<code>')
    const parsed = parseChangelogComment(comment)
    expect(parsed?.dto.changes[0]).toMatchObject({
      description: 'backticks `demo` stay raw'
    })
  })
})

describe('parseChangelogComment degrade signals', () => {
  it('returns null for a null body', () => {
    expect(parseChangelogComment(null)).toBeNull()
  })

  it('returns null when there is no changelog comment', () => {
    expect(parseChangelogComment('## Features\n\n- #1 - a feature')).toBeNull()
  })

  it('returns null for malformed JSON inside the dto tags', () => {
    const body = '<!--\n<changelog:dto>\n{ not json ]\n</changelog:dto>\n-->'
    expect(parseChangelogComment(body)).toBeNull()
  })

  it('returns null for schema-invalid JSON (missing required field)', () => {
    const body = `<!--\n<changelog:dto>\n${JSON.stringify({
      $schema: CHANGELOG_DTO_SCHEMA_URL,
      changes: [{ source: 'squashedPR', prNumber: 1 }]
    })}\n</changelog:dto>\n-->`
    expect(parseChangelogComment(body)).toBeNull()
  })

  it('returns null for an unrecognized ($schema v2) URL', () => {
    const body = `<!--\n<changelog:dto>\n${JSON.stringify({
      $schema: 'https://nuqs.dev/schemas/changelog-dto.v2.json',
      changes: [],
      contributors: []
    })}\n</changelog:dto>\n-->`
    expect(parseChangelogComment(body)).toBeNull()
  })
})

describe('preamble extraction', () => {
  it('resolves an empty/whitespace preamble to null', () => {
    const body = [
      '<!--',
      '<changelog:preamble>   </changelog:preamble>',
      '<changelog:dto>',
      JSON.stringify(expectedDto),
      '</changelog:dto>',
      '-->'
    ].join('\n')
    expect(parseChangelogComment(body)?.preamble).toBeNull()
  })

  it('returns the trimmed markdown of a non-empty preamble', () => {
    const body = [
      '<!--',
      '<changelog:preamble>',
      'See the [migration guide](/docs/migrations/v2.9).',
      '</changelog:preamble>',
      '<changelog:dto>',
      JSON.stringify(expectedDto),
      '</changelog:dto>',
      '-->'
    ].join('\n')
    expect(parseChangelogComment(body)?.preamble).toBe(
      'See the [migration guide](/docs/migrations/v2.9).'
    )
  })
})

describe('groupChangesByCategory', () => {
  it('groups changes by their derived category', () => {
    const changes: Change[] = [
      {
        source: 'squashedPR',
        prNumber: 2,
        type: 'fix',
        breaking: false,
        description: 'a fix',
        author: null,
        closingIssues: []
      },
      {
        source: 'squashedPR',
        prNumber: 1,
        type: 'feat',
        breaking: false,
        description: 'a feature',
        author: null,
        closingIssues: []
      },
      {
        source: 'directCommit',
        sha: 'abcd1234',
        type: null,
        breaking: false,
        description: 'untyped commit',
        author: 'Someone'
      }
    ]
    const grouped = groupChangesByCategory(changes)
    expect(grouped.Features.map(c => c.description)).toEqual(['a feature'])
    expect(grouped['Bug fixes'].map(c => c.description)).toEqual(['a fix'])
    expect(grouped['Other changes'].map(c => c.description)).toEqual([
      'untyped commit'
    ])
  })

  // Slice 2: a squashed PR and a direct commit sharing a category must coexist
  // in one section, PRs first (ascending number), then commits in their given
  // (discovery oldest-first) order — the ordering the page now renders directly.
  it('coexists squashed PRs and direct commits in one category, in the correct order', () => {
    const changes: Change[] = [
      {
        source: 'directCommit',
        sha: 'aaaa1111',
        type: 'fix',
        breaking: false,
        description: 'first commit',
        author: 'Alice'
      },
      {
        source: 'squashedPR',
        prNumber: 9,
        type: 'fix',
        breaking: false,
        description: 'pr nine',
        author: null,
        closingIssues: []
      },
      {
        source: 'directCommit',
        sha: 'bbbb2222',
        type: 'fix',
        breaking: false,
        description: 'second commit',
        author: 'Bob'
      },
      {
        source: 'squashedPR',
        prNumber: 3,
        type: 'fix',
        breaking: false,
        description: 'pr three',
        author: null,
        closingIssues: []
      }
    ]
    expect(
      groupChangesByCategory(changes)['Bug fixes'].map(c => c.description)
    ).toEqual(['pr three', 'pr nine', 'first commit', 'second commit'])
  })

  // Grouping must preserve every direct commit by identity (no dedup/collapse),
  // so the page can render each — keyed on its distinct `sha` — instead of
  // dropping any (the v2.8.10-beta.1 class of seven untyped direct commits).
  it('preserves every direct commit by distinct sha when grouping', () => {
    const shas = Array.from({ length: 7 }, (_, index) => `c0ffee0${index}`)
    const changes: Change[] = shas.map(sha => ({
      source: 'directCommit',
      sha,
      type: null,
      breaking: false,
      description: `direct commit ${sha}`,
      author: 'François Best'
    }))
    expect(
      groupChangesByCategory(changes)['Other changes'].map(c =>
        c.source === 'directCommit' ? c.sha : c.prNumber
      )
    ).toEqual(shas)
  })
})

describe('stripChangelogComment', () => {
  it('removes the appended changelog comment from a notes body', () => {
    const notes = '## Features\n\n- #1450 - return null'
    const body = `${notes}\n\n${renderChangelogComment(release)}`
    expect(stripChangelogComment(body)).toBe(notes)
  })

  it('leaves a body without the comment untouched', () => {
    const notes = '## Features\n\n- #1 - a feature'
    expect(stripChangelogComment(notes)).toBe(notes)
  })

  it('strips the comment regardless of CRLF line endings, and past an earlier migration comment', () => {
    const notes =
      '## Breaking changes\n\n<!-- todo: Add migration steps -->\n\n## Features\n\n- #1450 - return null'
    const body = `${notes}\n\n${renderChangelogComment(release)}`.replace(
      /\n/g,
      '\r\n'
    )
    expect(stripChangelogComment(body)).toBe(notes.replace(/\n/g, '\r\n'))
  })
})
