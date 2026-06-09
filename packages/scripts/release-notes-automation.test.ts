import { describe, expect, it } from 'vitest'
import type { PR } from './lib/commit-graph'
import {
  formatClosingIssues,
  formatThanksSection,
  formatTitle,
  groupPRsByCategory,
  splitCategoryTitle
} from './release-notes-automation'

// Helper to create a minimal PR object for testing
function createPR(
  overrides: Partial<PR> & { number: number; title: string }
): PR {
  return {
    author: null,
    participants: { nodes: [] },
    closingIssuesReferences: { edges: [] },
    ...overrides
  }
}

describe('splitCategoryTitle', () => {
  it('parses feat: prefix as Features', () => {
    const [category, title] = splitCategoryTitle('feat: add new feature')
    expect(category).toBe('Features')
    expect(title).toBe('add new feature')
  })

  it('parses feat(scope): prefix as Features', () => {
    const [category, title] = splitCategoryTitle('feat(core): add new feature')
    expect(category).toBe('Features')
    expect(title).toBe('add new feature')
  })

  it('parses fix: prefix as Bug fixes', () => {
    const [category, title] = splitCategoryTitle('fix: resolve issue')
    expect(category).toBe('Bug fixes')
    expect(title).toBe('resolve issue')
  })

  it('parses fix(scope): prefix as Bug fixes', () => {
    const [category, title] = splitCategoryTitle('fix(parser): resolve issue')
    expect(category).toBe('Bug fixes')
    expect(title).toBe('resolve issue')
  })

  it('parses doc: prefix as Documentation', () => {
    const [category, title] = splitCategoryTitle('doc: update readme')
    expect(category).toBe('Documentation')
    expect(title).toBe('update readme')
  })

  it('parses docs: prefix as Documentation', () => {
    const [category, title] = splitCategoryTitle('docs: update readme')
    expect(category).toBe('Documentation')
    expect(title).toBe('update readme')
  })

  it('parses chore: prefix as Other changes', () => {
    const [category, title] = splitCategoryTitle('chore: update deps')
    expect(category).toBe('Other changes')
    expect(title).toBe('update deps')
  })

  it('parses refactor: prefix as Other changes', () => {
    const [category, title] = splitCategoryTitle('refactor: clean up code')
    expect(category).toBe('Other changes')
    expect(title).toBe('clean up code')
  })

  it('handles titles without conventional commit prefix', () => {
    const [category, title] = splitCategoryTitle('Some random title')
    expect(category).toBe('Other changes')
    expect(title).toBe('Some random title')
  })

  it('categorises a non-lowercase type prefix as "Other changes"', () => {
    const [category1, title1] = splitCategoryTitle('FEAT: uppercase')
    const [category2, title2] = splitCategoryTitle('Feat: TitleCase desc')
    expect(category1).toBe('Other changes')
    expect(title1).toBe('FEAT: uppercase')
    expect(category2).toBe('Other changes')
    expect(title2).toBe('Feat: TitleCase desc')
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

describe('groupPRsByCategory', () => {
  it('groups PRs by their category', () => {
    const prs: PR[] = [
      createPR({ number: 1, title: 'feat: new feature' }),
      createPR({ number: 2, title: 'fix: bug fix' }),
      createPR({ number: 3, title: 'docs: update docs' }),
      createPR({ number: 4, title: 'chore: maintenance' })
    ]

    const result = groupPRsByCategory(prs)

    expect(result.Features).toHaveLength(1)
    expect(result.Features[0]!.number).toBe(1)
    expect(result.Features[0]!.title).toBe('new feature')

    expect(result['Bug fixes']).toHaveLength(1)
    expect(result['Bug fixes'][0]!.number).toBe(2)
    expect(result['Bug fixes'][0]!.title).toBe('bug fix')

    expect(result.Documentation).toHaveLength(1)
    expect(result.Documentation[0]!.number).toBe(3)
    expect(result.Documentation[0]!.title).toBe('update docs')
    expect(result['Other changes']).toHaveLength(1)
    expect(result['Other changes'][0]!.number).toBe(4)
    expect(result['Other changes'][0]!.title).toBe('maintenance')
  })

  it('sorts PRs by number within each category', () => {
    const prs: PR[] = [
      createPR({ number: 30, title: 'feat: third' }),
      createPR({ number: 10, title: 'feat: first' }),
      createPR({ number: 20, title: 'feat: second' })
    ]

    const result = groupPRsByCategory(prs)

    expect(result.Features.map(pr => pr.number)).toEqual([10, 20, 30])
  })

  it('includes author information', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        author: { login: 'testuser' }
      })
    ]

    const result = groupPRsByCategory(prs)
    expect(result.Features[0]!.author).toBe('testuser')
  })

  it('includes closing issues information', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'fix: resolve bug',
        closingIssuesReferences: {
          edges: [
            { node: { number: 100, participants: { nodes: [] } } },
            { node: { number: 101, participants: { nodes: [] } } }
          ]
        }
      })
    ]

    const result = groupPRsByCategory(prs)
    expect(result['Bug fixes'][0]!.closingIssues).toEqual([
      { number: 100 },
      { number: 101 }
    ])
  })
})
