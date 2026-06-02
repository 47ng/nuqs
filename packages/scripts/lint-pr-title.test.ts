import { describe, expect, it } from 'vitest'
import {
  formatSummary,
  HEADER_MAX_LENGTH,
  readTypeEnum,
  validateTitle
} from './lint-pr-title'

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
