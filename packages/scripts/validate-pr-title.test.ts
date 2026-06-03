import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classify } from './lib/conventional-commits.ts'
import {
  formatFailSummary,
  formatPassSummary,
  formatSummary,
  hasCoreChanges,
  HEADER_MAX_LENGTH,
  NON_BUMPING_TYPES,
  parseChangedFiles,
  readTypeEnum,
  validateTitle
} from './validate-pr-title.ts'

// --- PR title format / type / length -----------------------------------------

describe('readTypeEnum', () => {
  it('extracts the third element of type-enum', () => {
    const json = JSON.stringify({
      commitlint: {
        rules: { 'type-enum': [2, 'always', ['feat', 'fix']] }
      }
    })
    expect(readTypeEnum(json)).toEqual(['feat', 'fix'])
  })

  it('throws when commitlint config is missing', () => {
    expect(() => readTypeEnum('{}')).toThrow(
      /missing commitlint.rules.type-enum/
    )
  })

  it('throws when type-enum is not a string array', () => {
    const json = JSON.stringify({
      commitlint: { rules: { 'type-enum': [2, 'always', [1, 2]] } }
    })
    expect(() => readTypeEnum(json)).toThrow()
  })

  it('throws when type-enum is missing the third element', () => {
    const json = JSON.stringify({
      commitlint: { rules: { 'type-enum': [2, 'always'] } }
    })
    expect(() => readTypeEnum(json)).toThrow()
  })
})

describe('validateTitle', () => {
  const allowed = ['feat', 'fix', 'chore']

  it('returns no errors for a valid title', () => {
    expect(validateTitle('feat: add parser', allowed)).toEqual([])
  })

  it('flags disallowed type', () => {
    const errors = validateTitle('wip: experiment', allowed)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/wip.*not allowed/)
  })

  it('flags missing colon (format)', () => {
    const errors = validateTitle('no colon here', allowed)
    expect(errors[0]).toMatch(/format/)
  })

  it('flags an uppercase type as a format error', () => {
    expect(validateTitle('Feat: add parser', allowed)[0]).toMatch(/format/)
    expect(validateTitle('FIX: bug', allowed)[0]).toMatch(/format/)
  })

  it('flags a non-letter prefix as a format error', () => {
    expect(validateTitle('123: subject', allowed)[0]).toMatch(/format/)
  })

  it('flags a type-only title with no subject as a format error', () => {
    expect(validateTitle('feat:', allowed)[0]).toMatch(/format/)
  })

  it('flags titles over the max length', () => {
    const longSubject = 'feat: ' + 'x'.repeat(HEADER_MAX_LENGTH)
    const errors = validateTitle(longSubject, allowed)
    expect(errors.some(e => /exceeds.*characters/.test(e))).toBe(true)
  })

  it('accepts a title at exactly the max length', () => {
    const prefix = 'feat: '
    const title = prefix + 'x'.repeat(HEADER_MAX_LENGTH - prefix.length)
    expect(title.length).toBe(HEADER_MAX_LENGTH)
    expect(validateTitle(title, allowed)).toEqual([])
  })

  it('flags a title one character over the max length', () => {
    const prefix = 'feat: '
    const title = prefix + 'x'.repeat(HEADER_MAX_LENGTH - prefix.length + 1)
    expect(title.length).toBe(HEADER_MAX_LENGTH + 1)
    const errors = validateTitle(title, allowed)
    expect(errors.some(e => /exceeds/.test(e))).toBe(true)
  })

  it('reports format and length errors together', () => {
    const errors = validateTitle('x'.repeat(150), allowed)
    expect(errors).toHaveLength(2)
  })
})

describe('formatSummary', () => {
  it('returns valid section for empty errors', () => {
    const out = formatSummary([])
    expect(out).toContain('✅')
    expect(out).toContain('Valid')
  })

  it('lists all errors as bullet items', () => {
    const out = formatSummary(['err one', 'err two'])
    expect(out).toContain('❌')
    expect(out).toContain('- err one')
    expect(out).toContain('- err two')
  })
})

// --- Version-bump consistency -------------------------------------------------

describe('NON_BUMPING_TYPES', () => {
  // The failure summary lists these as the alternatives to a bumping type, so
  // they must stay in sync with the commitlint config: exactly the allowed
  // types that `classify` decides do not trigger a release.
  it('matches the non-bumping types in the commitlint config', () => {
    const types = readTypeEnum(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    )
    const nonBumping = types
      .filter(t => classify(`${t}: subject`).bump === null)
      .sort()
    expect(NON_BUMPING_TYPES.toSorted()).toEqual(nonBumping)
  })
})

describe('hasCoreChanges', () => {
  it('returns true when any file is under packages/nuqs/', () => {
    expect(
      hasCoreChanges(['docs/intro.md', 'packages/nuqs/src/index.ts'])
    ).toBe(true)
  })

  it('returns false when no file is under packages/nuqs/', () => {
    expect(hasCoreChanges(['docs/intro.md', 'README.md'])).toBe(false)
  })

  it('returns false for empty list', () => {
    expect(hasCoreChanges([])).toBe(false)
  })

  it('does not match similarly-prefixed paths', () => {
    expect(hasCoreChanges(['packages/nuqs-other/file.ts'])).toBe(false)
  })
})

describe('parseChangedFiles', () => {
  it('splits newline-separated entries and trims', () => {
    expect(parseChangedFiles('a.ts\nb.ts\nc.ts')).toEqual([
      'a.ts',
      'b.ts',
      'c.ts'
    ])
  })

  it('preserves filenames containing spaces', () => {
    expect(
      parseChangedFiles('packages/nuqs/src/My Component.ts\ndocs/README.md')
    ).toEqual(['packages/nuqs/src/My Component.ts', 'docs/README.md'])
  })

  it('tolerates a trailing newline', () => {
    expect(parseChangedFiles('a.ts\nb.ts\n')).toEqual(['a.ts', 'b.ts'])
  })

  it('drops blank lines', () => {
    expect(parseChangedFiles('a.ts\n\nb.ts')).toEqual(['a.ts', 'b.ts'])
  })

  it('returns empty array for empty input', () => {
    expect(parseChangedFiles('')).toEqual([])
    expect(parseChangedFiles('   ')).toEqual([])
  })
})

describe('formatPassSummary', () => {
  it('mentions the type and the core package', () => {
    const out = formatPassSummary('feat')
    expect(out).toContain('feat')
    expect(out).toContain('packages/nuqs')
    expect(out).toContain('✅')
  })
})

describe('formatFailSummary', () => {
  it('mentions the type and the non-bumping alternatives', () => {
    const out = formatFailSummary('feat')
    expect(out).toContain('feat')
    expect(out).toContain('chore')
    expect(out).toContain('Use for')
    expect(out).toContain('❌')
  })
})
