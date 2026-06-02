import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readTypeEnum } from '../validate-pr-title.ts'
import { classify } from './conventional-commits.ts'

describe('classify', () => {
  it('classifies a fix as a patch bump', () => {
    expect(classify('fix: a bug')).toEqual({
      bump: 'patch',
      type: 'fix',
      description: 'a bug'
    })
  })

  it('classifies a feat as a minor bump', () => {
    expect(classify('feat: a feature')).toEqual({
      bump: 'minor',
      type: 'feat',
      description: 'a feature'
    })
  })

  it('classifies a "!" marker as a major bump, keeping the type', () => {
    expect(classify('feat!: a breaking feature')).toEqual({
      bump: 'major',
      type: 'feat',
      description: 'a breaking feature'
    })
  })

  it('classifies a "!" marker as a major bump, keeping the type (with scope)', () => {
    expect(classify('feat(scope)!: a breaking feature')).toEqual({
      bump: 'major',
      type: 'feat',
      description: 'a breaking feature'
    })
  })

  it('classifies a "!" marker as a major bump even for non-bumping types', () => {
    expect(classify('chore!: boom')).toEqual({
      bump: 'major',
      type: 'chore',
      description: 'boom'
    })
  })

  it('classifies an uppercase BREAKING CHANGE footer as a major bump', () => {
    const message = 'fix: a fix\n\nBREAKING CHANGE: removed an API'
    expect(classify(message)).toMatchObject({ bump: 'major', type: 'fix' })
  })

  it('classifies a hyphenated BREAKING-CHANGE footer as a major bump', () => {
    const message = 'fix: a fix\n\nBREAKING-CHANGE: removed an API'
    expect(classify(message)).toMatchObject({ bump: 'major', type: 'fix' })
  })

  it('ignores a lowercase "breaking change" mention in prose', () => {
    const message = 'feat: a feature\n\nthis is a breaking change in prose'
    expect(classify(message)).toMatchObject({ bump: 'minor', type: 'feat' })
  })

  it('treats perf and revert as patch bumps', () => {
    expect(classify('perf: speed up')).toMatchObject({
      bump: 'patch',
      type: 'perf'
    })
    expect(classify('revert: undo a change')).toMatchObject({
      bump: 'patch',
      type: 'revert'
    })
  })

  it('classifies a known non-bumping type with no bump, keeping the type', () => {
    expect(classify('chore: housekeeping')).toEqual({
      bump: null,
      type: 'chore',
      description: 'housekeeping'
    })
  })

  it('strips an optional scope from the description', () => {
    expect(classify('feat(parser): add support')).toEqual({
      bump: 'minor',
      type: 'feat',
      description: 'add support'
    })
  })

  it('uses the first line as the description when the message is unparseable', () => {
    expect(classify('not a conventional commit')).toEqual({
      bump: null,
      type: undefined,
      description: 'not a conventional commit'
    })
  })

  it('requires a subject after the colon (strict format)', () => {
    expect(classify('feat:')).toEqual({
      bump: null,
      type: undefined,
      description: 'feat:'
    })
  })

  it('rejects an empty scope', () => {
    expect(classify('feat(): a feature')).toMatchObject({
      bump: null,
      type: undefined
    })
  })

  it('does not treat an uppercase type as conventional', () => {
    expect(classify('FEAT: shout')).toMatchObject({
      bump: null,
      type: undefined
    })
  })
})

// Guards against drift between the bump taxonomy hard-coded in `classify` and
// the canonical list of allowed commit types in the root commitlint config. If
// a type is added/removed/renamed there, or the switch changes, this fails.
describe('classify vs. commitlint type-enum', () => {
  const types = readTypeEnum(
    readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
  ).sort() // sort for deterministic comparison order

  it('recognises every allowed type as conventional', () => {
    for (const type of types) {
      expect(classify(`${type}: subject`).type).toBe(type)
    }
  })

  it('bumps on exactly feat/fix/perf/revert', () => {
    const bumping = types.filter(t => classify(`${t}: subject`).bump !== null)
    expect(bumping).toEqual(['feat', 'fix', 'perf', 'revert'])
  })
})
