import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classify } from './lib/conventional-commits'
import { readTypeEnum } from './lint-pr-title'
import {
  formatFailSummary,
  formatPassSummary,
  hasCoreChanges,
  NON_BUMPING_TYPES,
  parseChangedFiles
} from './check-version-bump'

describe('NON_BUMPING_TYPES', () => {
  // The failure summary lists these as the alternatives to a bumping type, so
  // they must stay in sync with the commitlint config: exactly the allowed
  // types that `classify` decides do not trigger a release.
  it('matches the non-bumping types in the commitlint config', () => {
    const types = readTypeEnum(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    )
    const nonBumping = types.filter(
      t => classify(`${t}: subject`).bump === null
    )
    expect([...NON_BUMPING_TYPES]).toEqual(nonBumping)
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
