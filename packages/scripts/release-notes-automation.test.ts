import { describe, expect, it } from 'vitest'
import type {
  Change,
  DirectCommitChange,
  SquashedPRChange
} from './lib/commit-graph'
import {
  breakingChanges,
  formatChangeLine,
  formatClosingIssues,
  formatThanksSection,
  formatTitle,
  groupChangesByCategory,
  renderReleaseNotes
} from './release-notes-automation'

// Minimal PR-sourced change for testing.
function createChange(
  overrides: Partial<SquashedPRChange> & { prNumber: number }
): SquashedPRChange {
  return {
    source: 'squashedPR',
    type: undefined,
    breaking: false,
    description: '',
    author: null,
    closingIssues: [],
    ...overrides
  }
}

// Minimal direct-commit change for testing.
function createDirectCommitChange(
  overrides: Partial<DirectCommitChange> & { sha: string }
): DirectCommitChange {
  return {
    source: 'directCommit',
    type: undefined,
    breaking: false,
    description: '',
    author: 'Committer',
    ...overrides
  }
}

// PR numbers of the PR-sourced changes (commit-sourced have none).
const prNums = (changes: Change[]): number[] =>
  changes.flatMap(c => (c.source === 'squashedPR' ? [c.prNumber] : []))

describe('groupChangesByCategory', () => {
  it('categorises by the squash commit type, never the (reworded) PR description', () => {
    // The squash commit was `fix:`; the PR title was later reworded to arbitrary
    // prose. Category must follow the immutable commit type, and the rendered
    // text is the prose description as-is.
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'fix', description: 'reworded prose' })
    ]
    const result = groupChangesByCategory(changes)
    expect(result['Bug fixes']).toHaveLength(1)
    expect(prNums(result['Bug fixes'])).toEqual([1])
    expect(result['Bug fixes'][0]!.description).toBe('reworded prose')
    expect(result.Features).toHaveLength(0)
  })

  it('maps each type to its category, falling back to Other changes', () => {
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'feat', description: 'new feature' }),
      createChange({ prNumber: 2, type: 'fix', description: 'bug fix' }),
      createChange({ prNumber: 3, type: 'doc', description: 'update docs' }),
      createChange({ prNumber: 4, type: 'docs', description: 'more docs' }),
      createChange({ prNumber: 5, type: 'chore', description: 'maintenance' }),
      createChange({ prNumber: 6, type: undefined, description: 'no type' })
    ]

    const result = groupChangesByCategory(changes)

    expect(prNums(result.Features)).toEqual([1])
    expect(prNums(result['Bug fixes'])).toEqual([2])
    expect(prNums(result.Documentation)).toEqual([3, 4])
    expect(prNums(result['Other changes'])).toEqual([5, 6])
  })

  it('sorts changes by PR number within each category', () => {
    const changes: Change[] = [
      createChange({ prNumber: 30, type: 'feat', description: 'third' }),
      createChange({ prNumber: 10, type: 'feat', description: 'first' }),
      createChange({ prNumber: 20, type: 'feat', description: 'second' })
    ]

    const result = groupChangesByCategory(changes)

    expect(prNums(result.Features)).toEqual([10, 20, 30])
  })

  it('orders a category PR-first (by number) then direct commits (oldest-first input order)', () => {
    // Discovery supplies commit changes oldest-first; grouping keeps that order
    // (stable sort) and places them after the PR changes.
    const changes: Change[] = [
      createDirectCommitChange({
        sha: 'older111',
        type: 'feat',
        description: 'older'
      }),
      createDirectCommitChange({
        sha: 'newer222',
        type: 'feat',
        description: 'newer'
      }),
      createChange({ prNumber: 5, type: 'feat', description: 'a PR' })
    ]
    const result = groupChangesByCategory(changes)
    expect(
      result.Features.map(c =>
        c.source === 'squashedPR' ? `#${c.prNumber}` : c.sha
      )
    ).toEqual(['#5', 'older111', 'newer222'])
  })

  it('keeps a breaking change in its type category and carries the breaking flag', () => {
    // Additive, not exclusive: a `feat!` is still a Feature; the section is
    // driven separately by the breaking filter. The flag rides along so the
    // renderer can decorate the line.
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'feat', breaking: true }),
      createChange({ prNumber: 2, type: 'feat', breaking: false })
    ]
    const result = groupChangesByCategory(changes)
    expect(prNums(result.Features)).toEqual([1, 2])
    expect(result.Features.map(c => c.breaking)).toEqual([true, false])
  })

  it('includes author information', () => {
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'feat', author: 'testuser' })
    ]

    const result = groupChangesByCategory(changes)
    expect(result.Features[0]!.author).toBe('testuser')
  })

  it('includes closing issues information', () => {
    const changes: Change[] = [
      createChange({
        prNumber: 1,
        type: 'fix',
        closingIssues: [{ number: 100 }, { number: 101 }]
      })
    ]

    const result = groupChangesByCategory(changes)
    const change = result['Bug fixes'][0]!
    expect(change.source === 'squashedPR' ? change.closingIssues : []).toEqual([
      { number: 100 },
      { number: 101 }
    ])
  })
})

describe('breakingChanges', () => {
  it('returns empty when nothing is breaking', () => {
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'feat' }),
      createChange({ prNumber: 2, type: 'fix' })
    ]
    expect(breakingChanges(changes)).toEqual([])
  })

  it('selects only breaking changes, across categories, ordered by PR number', () => {
    // A breaking change cross-cuts categories: a `feat!` and a `fix!` both
    // surface here regardless of type, sorted by PR number.
    const changes: Change[] = [
      createChange({ prNumber: 30, type: 'fix', breaking: true }),
      createChange({ prNumber: 10, type: 'feat', breaking: true }),
      createChange({ prNumber: 20, type: 'feat', breaking: false })
    ]
    expect(prNums(breakingChanges(changes))).toEqual([10, 30])
  })
})

describe('renderReleaseNotes', () => {
  it('leads with the breaking-changes section + migration placeholder, then decorates type sections', () => {
    const changes: Change[] = [
      createChange({
        prNumber: 1,
        type: 'feat',
        breaking: true,
        description: 'drop legacy',
        author: 'alice'
      }),
      createChange({
        prNumber: 2,
        type: 'fix',
        breaking: false,
        description: 'fix bug',
        author: 'bob',
        closingIssues: [{ number: 9 }]
      })
    ]
    expect(renderReleaseNotes(changes, ['alice', 'bob'])).toBe(
      [
        '## Breaking changes',
        '',
        '- #1 - drop legacy, by @alice',
        '',
        '### Migration guide',
        '',
        '<!-- todo: Add migration steps for breaking changes -->',
        '',
        '## Features',
        '',
        '- #1 - drop legacy, by @alice - ⚠️ breaking change',
        '',
        '## Bug fixes',
        '',
        '- #2 - fix bug, by @bob (closes #9)',
        '',
        '## Thanks',
        '',
        'Huge thanks to @alice and @bob for helping!'
      ].join('\n')
    )
  })

  it('surfaces a breaking non-bumping type in both the Breaking section and its Other-changes section', () => {
    // breaking is orthogonal to category: a `chore!` is Other changes, yet still
    // leads the Breaking section (undecorated) and is flagged ⚠️ in its section.
    const changes: Change[] = [
      createChange({
        prNumber: 1,
        type: 'chore',
        breaking: true,
        description: 'drop Node 18 support',
        author: 'alice'
      })
    ]
    expect(renderReleaseNotes(changes, [])).toBe(
      [
        '## Breaking changes',
        '',
        '- #1 - drop Node 18 support, by @alice',
        '',
        '### Migration guide',
        '',
        '<!-- todo: Add migration steps for breaking changes -->',
        '',
        '## Other changes',
        '',
        '- #1 - drop Node 18 support, by @alice - ⚠️ breaking change'
      ].join('\n')
    )
  })

  it('omits the breaking section entirely when nothing is breaking', () => {
    const changes: Change[] = [
      createChange({ prNumber: 1, type: 'feat', description: 'a feature' })
    ]
    const output = renderReleaseNotes(changes, [])
    expect(output).not.toContain('Breaking changes')
    expect(output).not.toContain('Migration guide')
    expect(output).toBe(['## Features', '', '- #1 - a feature'].join('\n'))
  })
})

describe('formatTitle', () => {
  it('converts single backtick code to <code> tag', () => {
    expect(formatTitle('Add `useQueryState` hook')).toBe(
      'Add <code>useQueryState</code> hook'
    )
  })

  it('converts multiple backtick codes to <code> tags', () => {
    expect(formatTitle('Replace `foo` with `bar`')).toBe(
      'Replace <code>foo</code> with <code>bar</code>'
    )
  })

  it('leaves titles without backticks unchanged', () => {
    expect(formatTitle('Simple title without code')).toBe(
      'Simple title without code'
    )
  })

  it('handles empty title', () => {
    expect(formatTitle('')).toBe('')
  })

  it('handles code at the start of title', () => {
    expect(formatTitle('`nuqs` is great')).toBe('<code>nuqs</code> is great')
  })

  it('handles code at the end of title', () => {
    expect(formatTitle('Check out `nuqs`')).toBe('Check out <code>nuqs</code>')
  })
})

describe('formatChangeLine', () => {
  const line: Change = {
    source: 'squashedPR',
    prNumber: 123,
    type: 'feat',
    description: 'add `useQueryState`',
    author: 'alice',
    closingIssues: [{ number: 5 }],
    breaking: true
  }

  it('renders a direct-commit change with its SHA and author (no @, no closes)', () => {
    const commit = createDirectCommitChange({
      sha: 'abcd1234',
      description: 'hot patch',
      author: 'Jane Doe',
      breaking: false
    })
    expect(formatChangeLine(commit)).toBe('- abcd1234 - hot patch, by Jane Doe')
    expect(formatChangeLine(commit, { decorateBreaking: true })).toBe(
      '- abcd1234 - hot patch, by Jane Doe'
    )
  })

  it('decorates a breaking direct-commit change in its type section', () => {
    const commit = createDirectCommitChange({
      sha: 'abcd1234',
      description: 'remove API',
      author: 'Jane Doe',
      breaking: true
    })
    expect(formatChangeLine(commit, { decorateBreaking: true })).toBe(
      '- abcd1234 - remove API, by Jane Doe - ⚠️ breaking change'
    )
  })

  it('renders number, formatted title, author and closing issues', () => {
    expect(formatChangeLine({ ...line, breaking: false })).toBe(
      '- #123 - add <code>useQueryState</code>, by @alice (closes #5)'
    )
  })

  it('omits the author segment when there is no author', () => {
    expect(
      formatChangeLine({
        ...line,
        author: null,
        closingIssues: [],
        breaking: false
      })
    ).toBe('- #123 - add <code>useQueryState</code>')
  })

  it('appends the ⚠️ marker when decorating a breaking change', () => {
    expect(formatChangeLine(line, { decorateBreaking: true })).toBe(
      '- #123 - add <code>useQueryState</code>, by @alice (closes #5) - ⚠️ breaking change'
    )
  })

  it('does not decorate a non-breaking change even when asked', () => {
    expect(
      formatChangeLine({ ...line, breaking: false }, { decorateBreaking: true })
    ).toBe('- #123 - add <code>useQueryState</code>, by @alice (closes #5)')
  })

  it('does not decorate a breaking change in the undecorated (top-section) render', () => {
    expect(formatChangeLine(line)).toBe(
      '- #123 - add <code>useQueryState</code>, by @alice (closes #5)'
    )
  })
})

describe('formatClosingIssues', () => {
  it('returns empty string for no issues', () => {
    expect(formatClosingIssues([])).toBe('')
  })

  it('formats single issue', () => {
    expect(formatClosingIssues([{ number: 123 }])).toBe(' (closes #123)')
  })

  it('formats multiple issues', () => {
    expect(formatClosingIssues([{ number: 123 }, { number: 456 }])).toBe(
      ' (closes #123, #456)'
    )
  })
})

describe('formatThanksSection', () => {
  it('returns null for empty contributors', () => {
    expect(formatThanksSection([])).toBeNull()
  })

  it('formats single contributor', () => {
    expect(formatThanksSection(['alice'])).toBe(
      'Huge thanks to @alice for helping!'
    )
  })

  it('formats two contributors with "and"', () => {
    expect(formatThanksSection(['alice', 'bob'])).toBe(
      'Huge thanks to @alice and @bob for helping!'
    )
  })

  it('formats three+ contributors with oxford comma', () => {
    expect(formatThanksSection(['alice', 'bob', 'charlie'])).toBe(
      'Huge thanks to @alice, @bob, and @charlie for helping!'
    )
  })
})
