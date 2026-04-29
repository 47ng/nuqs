import { describe, expect, it } from 'vitest'
import {
  extractType,
  formatFailSummary,
  formatPassSummary,
  hasCoreChanges,
  isVersionBumping,
  parseChangedFiles
} from './check-version-bump'

describe('extractType', () => {
  it('extracts type from "feat: subject"', () => {
    expect(extractType('feat: subject')).toBe('feat')
  })

  it('extracts type from "fix(scope): subject"', () => {
    expect(extractType('fix(scope): subject')).toBe('fix')
  })

  it('returns undefined for empty title', () => {
    expect(extractType('')).toBeUndefined()
  })

  it('returns undefined for non-letter prefix', () => {
    expect(extractType('123 something')).toBeUndefined()
  })
})

describe('isVersionBumping', () => {
  it('returns true for bumping types', () => {
    for (const t of ['feat', 'fix', 'perf', 'revert']) {
      expect(isVersionBumping(t)).toBe(true)
    }
  })

  it('returns false for non-bumping types', () => {
    for (const t of ['chore', 'doc', 'ci', 'build', 'style']) {
      expect(isVersionBumping(t)).toBe(false)
    }
  })

  it('returns false for undefined', () => {
    expect(isVersionBumping(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isVersionBumping('')).toBe(false)
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
