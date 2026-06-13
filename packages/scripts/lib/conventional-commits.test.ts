import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readTypeEnum } from '../validate-pr-title.ts'
import {
  bumpForType,
  parseCommit,
  parseSubject
} from './conventional-commits.ts'

describe('parseCommit', () => {
  it('parses a subject-only message like parseSubject', () => {
    expect(parseCommit('feat: a feature')).toEqual({
      type: 'feat',
      breaking: false,
      description: 'a feature'
    })
  })

  it('flags the subject "!" as breaking', () => {
    expect(parseCommit('feat!: boom')).toMatchObject({
      type: 'feat',
      breaking: true
    })
  })

  it('flags an uppercase BREAKING CHANGE body footer as breaking, keeping the type', () => {
    expect(
      parseCommit('fix: a fix\n\nBREAKING CHANGE: removed an API')
    ).toEqual({ type: 'fix', breaking: true, description: 'a fix' })
  })

  it('flags a hyphenated BREAKING-CHANGE footer as breaking', () => {
    expect(
      parseCommit('fix: a fix\n\nBREAKING-CHANGE: removed an API')
    ).toMatchObject({ type: 'fix', breaking: true })
  })

  it('ignores a lowercase "breaking change" mention in prose', () => {
    expect(
      parseCommit('feat: a feature\n\nthis is a breaking change in prose')
    ).toMatchObject({ type: 'feat', breaking: false })
  })
})

describe('bumpForType', () => {
  it('maps feat to minor and fix/perf/revert to patch', () => {
    expect(bumpForType('feat', false)).toBe('minor')
    expect(bumpForType('fix', false)).toBe('patch')
    expect(bumpForType('perf', false)).toBe('patch')
    expect(bumpForType('revert', false)).toBe('patch')
  })

  it('returns null for non-bumping and unknown types', () => {
    expect(bumpForType('chore', false)).toBeNull()
    expect(bumpForType('whatever', false)).toBeNull()
    expect(bumpForType(undefined, false)).toBeNull()
  })

  it('forces major when breaking, regardless of type', () => {
    expect(bumpForType('feat', true)).toBe('major')
    expect(bumpForType('chore', true)).toBe('major')
    expect(bumpForType(undefined, true)).toBe('major')
  })
})

describe('parseSubject', () => {
  it('parses type and description from a conventional subject', () => {
    expect(parseSubject('feat: a feature')).toEqual({
      type: 'feat',
      breaking: false,
      description: 'a feature'
    })
  })

  it('flags the "!" breaking marker, keeping the type', () => {
    expect(parseSubject('feat!: a breaking feature')).toEqual({
      type: 'feat',
      breaking: true,
      description: 'a breaking feature'
    })
  })

  it('strips an optional scope from the description', () => {
    expect(parseSubject('feat(parser): add support')).toEqual({
      type: 'feat',
      breaking: false,
      description: 'add support'
    })
  })

  it('flags "!" after a scope', () => {
    expect(parseSubject('feat(scope)!: boom')).toEqual({
      type: 'feat',
      breaking: true,
      description: 'boom'
    })
  })

  it("does NOT treat a BREAKING CHANGE body footer as breaking (the subject parser reads the `!` only; the footer is parseCommit's job)", () => {
    expect(
      parseSubject('fix: a fix\n\nBREAKING CHANGE: removed an API')
    ).toEqual({ type: 'fix', breaking: false, description: 'a fix' })
  })

  it('returns an undefined type and the raw first line when unparseable', () => {
    expect(parseSubject('not a conventional commit')).toEqual({
      type: undefined,
      breaking: false,
      description: 'not a conventional commit'
    })
  })

  it('requires a subject after the colon (strict format)', () => {
    expect(parseSubject('feat:')).toMatchObject({ type: undefined })
  })

  it('does not treat an uppercase type as conventional', () => {
    expect(parseSubject('FEAT: shout')).toMatchObject({ type: undefined })
  })

  it('rejects an empty scope', () => {
    expect(parseSubject('feat(): a feature')).toMatchObject({ type: undefined })
  })
})

// Guards against drift between the bump/type taxonomy hard-coded in
// `parseSubject`/`bumpForType` and the canonical list of allowed commit types in
// the root commitlint config. If a type is added/removed/renamed there, or the
// derivations change, this fails.
describe('parseSubject/bumpForType vs. commitlint type-enum', () => {
  const types = readTypeEnum(
    readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
  ).sort() // sort for deterministic comparison order

  it('recognises every allowed type as conventional', () => {
    for (const type of types) {
      expect(parseSubject(`${type}: subject`).type).toBe(type)
    }
  })

  it('bumps on exactly feat/fix/perf/revert', () => {
    const bumping = types.filter(t => bumpForType(t, false) !== null)
    expect(bumping).toEqual(['feat', 'fix', 'perf', 'revert'])
  })
})
