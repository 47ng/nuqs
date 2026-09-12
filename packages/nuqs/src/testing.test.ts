import { describe, expect, it, vi } from 'vitest'
import { createMultiParser, createParser } from './parsers'
import {
  isParserBijective,
  testParseThenSerialize,
  testSerializeThenParse
} from './testing'

const single = createParser({
  parse: value => (value === 'invalid' ? null : Number(value)),
  serialize: String
})

const multi = createMultiParser({
  parse: values => (values.includes('invalid') ? null : values.map(Number)),
  serialize: values => values.map(String),
  eq: (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
})

describe('parser testing helpers', () => {
  describe('isParserBijective', () => {
    it('accepts matching single and multi parser round trips', () => {
      expect(isParserBijective(single, '42', 42)).toBe(true)
      expect(isParserBijective(multi, ['1', '2'], [1, 2])).toBe(true)
    })

    it('rejects a serialized value that does not match the parser type', () => {
      expect(() =>
        // @ts-expect-error Testing the runtime guard for JavaScript callers.
        isParserBijective(single, ['42'], 42)
      ).toThrow(/mismatched parser type/)
      expect(() =>
        // @ts-expect-error Testing the runtime guard for JavaScript callers.
        isParserBijective(multi, '42', [42])
      ).toThrow(/mismatched parser type/)
    })

    it('rejects mismatched serialization and parsing independently', () => {
      expect(() => isParserBijective(single, '41', 42)).toThrow(
        /serialize does not match/
      )
      expect(() => isParserBijective(single, 'invalid', 42)).toThrow(
        /parsed value is null/
      )
      expect(() => isParserBijective(multi, ['41'], [42])).toThrow(
        /serialize does not match/
      )
      expect(() => isParserBijective(multi, ['invalid'], [42])).toThrow(
        /parsed value is null/
      )
    })

    it('uses the parser equality function for parsed values', () => {
      const caseInsensitive = createParser({
        parse: value => value,
        serialize: value => value.toUpperCase(),
        eq: (a, b) => a.toLowerCase() === b.toLowerCase()
      })
      expect(isParserBijective(caseInsensitive, 'NUQS', 'nuqs')).toBe(true)
    })

    it('checks parse-then-serialize after serialize-then-parse passes', () => {
      const normalizingSingle = createParser({
        parse: value => value.toLowerCase(),
        serialize: value => value.toUpperCase()
      })
      const normalizingMulti = createMultiParser({
        parse: values => values.map(value => value.toLowerCase()),
        serialize: values => values.map(value => value.toUpperCase()),
        eq: (a, b) => a.every((value, index) => value === b[index])
      })
      expect(() =>
        isParserBijective(normalizingSingle, 'nuqs', 'nuqs')
      ).toThrow(/parser is not bijective/)
      expect(() =>
        isParserBijective(normalizingMulti, ['nuqs'], ['nuqs'])
      ).toThrow(/parser is not bijective/)
    })

    it('checks the supplied serialization even when parsed values compare equal', () => {
      const parser = createParser({
        parse: String,
        serialize: String,
        eq: (a, b) => a.toLowerCase() === b.toLowerCase()
      })
      expect(() => isParserBijective(parser, 'NUQS', 'nuqs')).toThrow(
        /serialize does not match/
      )
    })
  })

  describe('testSerializeThenParse', () => {
    it('supports both parser types', () => {
      expect(testSerializeThenParse(single, 42)).toBe(true)
      expect(testSerializeThenParse(multi, [1, 2])).toBe(true)
    })

    it('rejects null parse results', () => {
      const nullSingle = createParser<number>({
        parse: () => null,
        serialize: String
      })
      const nullMulti = createMultiParser<number[]>({
        parse: () => null,
        serialize: values => values.map(String)
      })
      expect(() => testSerializeThenParse(nullSingle, 42)).toThrow(
        /parsed value is null/
      )
      expect(() => testSerializeThenParse(nullMulti, [42])).toThrow(
        /parsed value is null/
      )
    })

    it('rejects values changed by lossy serialization', () => {
      const lossy = createParser({
        parse: Number,
        serialize: value => String(Math.round(value))
      })
      expect(() => testSerializeThenParse(lossy, 1.5)).toThrow(
        /parser is not bijective/
      )
    })

    it('formats scalar values in bijectivity errors', () => {
      const parser = createParser({
        parse: () => 'received',
        serialize: String
      })
      expect(() => testSerializeThenParse(parser, 'expected')).toThrow(
        /Expected value:\s+expected\n\s+Received parsed value:\s+received/
      )
    })

    it('formats object values in bijectivity errors', () => {
      const parser = createParser({
        parse: () => ({ value: 'received' }),
        serialize: value => JSON.stringify(value),
        eq: (a, b) => a.value === b.value
      })
      expect(() =>
        testSerializeThenParse(parser, { value: 'expected' })
      ).toThrow(
        /Expected value:\s+\{"value":"expected"\}\n\s+Received parsed value:\s+\{"value":"received"\}/
      )
    })
  })

  describe('testParseThenSerialize', () => {
    it('supports both parser types', () => {
      expect(testParseThenSerialize(single, '42')).toBe(true)
      expect(testParseThenSerialize(multi, ['1', '2'])).toBe(true)
    })

    it('rejects null parse results', () => {
      expect(() => testParseThenSerialize(single, 'invalid')).toThrow(
        /parsed value is null/
      )
      expect(() => testParseThenSerialize(multi, ['invalid'])).toThrow(
        /parsed value is null/
      )
    })

    it('rejects values that serialize to a different query', () => {
      const normalizing = createParser({
        parse: value => value.toLowerCase(),
        serialize: String
      })
      expect(() => testParseThenSerialize(normalizing, 'NUQS')).toThrow(
        /parser is not bijective/
      )
    })

    it('rejects input queries with the wrong shape', () => {
      const parseSingle = vi.fn(() => 'value')
      const parseMulti = vi.fn(() => 'value')
      const tolerantSingle = createParser({
        parse: parseSingle,
        serialize: String
      })
      const tolerantMulti = createMultiParser({
        parse: parseMulti,
        serialize: value => [value]
      })
      expect(() =>
        testParseThenSerialize(tolerantSingle, ['value'] as never)
      ).toThrow(/parsed value is null/)
      expect(() =>
        testParseThenSerialize(tolerantMulti, 'value' as never)
      ).toThrow(/parsed value is null/)
      expect(parseSingle).not.toHaveBeenCalled()
      expect(parseMulti).not.toHaveBeenCalled()
    })
  })
})
