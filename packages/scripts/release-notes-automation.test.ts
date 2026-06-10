import { describe, expect, it } from 'vitest'
import type { Change } from './lib/commit-graph'
import {
  breakingChanges,
  formatChangeLine,
  formatClosingIssues,
  formatThanksSection,
  formatTitle,
  groupChangesByCategory,
  renderReleaseNotes
} from './release-notes-automation'

// Helper to create a minimal change for testing.
function createChange(
  overrides: Partial<Change> & { prNumber: number }
): Change {
  return {
    type: undefined,
    breaking: false,
    description: '',
    author: null,
    closingIssues: [],
    ...overrides
  }
}

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
    expect(result['Bug fixes'][0]!.number).toBe(1)
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

    expect(result.Features.map(c => c.number)).toEqual([1])
    expect(result['Bug fixes'].map(c => c.number)).toEqual([2])
    expect(result.Documentation.map(c => c.number)).toEqual([3, 4])
    expect(result['Other changes'].map(c => c.number)).toEqual([5, 6])
  })

  it('sorts changes by PR number within each category', () => {
    const changes: Change[] = [
      createChange({ prNumber: 30, type: 'feat', description: 'third' }),
      createChange({ prNumber: 10, type: 'feat', description: 'first' }),
      createChange({ prNumber: 20, type: 'feat', description: 'second' })
    ]

    const result = groupChangesByCategory(changes)

    expect(result.Features.map(c => c.number)).toEqual([10, 20, 30])
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
    expect(
      result.Features.map(c => ({ number: c.number, breaking: c.breaking }))
    ).toEqual([
      { number: 1, breaking: true },
      { number: 2, breaking: false }
    ])
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
    expect(result['Bug fixes'][0]!.closingIssues).toEqual([
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
    expect(breakingChanges(changes).map(c => c.prNumber)).toEqual([10, 30])
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
  const line = {
    number: 123,
    description: 'add `useQueryState`',
    author: 'alice',
    closingIssues: [{ number: 5 }],
    breaking: true
  }

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
