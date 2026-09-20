import {
  isParserBijective,
  testParseThenSerialize,
  testSerializeThenParse
} from 'nuqs/testing'
import { assertType, describe, expect, it } from 'vitest'
import { parseAsUuid } from './items/parser-uuid'

const uuid = (v = 4) => `01234567-890a-${v}${v}${v}${v}-8bcd-ef0123456789`
const nilUuid = '00000000-0000-0000-0000-000000000000'
const maxUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

describe('parseAsUuid', () => {
  it('rejects empty and invalid values', () => {
    expect(parseAsUuid().parse('')).toBeNull()
    expect(parseAsUuid().parse('foo')).toBeNull()
    expect(
      parseAsUuid().parse('01234567-890a-4bcd-0bcd-ef0123456789')
    ).toBeNull()
  })

  it('accepts any valid UUID version when none is specified', () => {
    expect(parseAsUuid().parse(uuid())).toBe(uuid())
    expect(parseAsUuid().parse(uuid(1))).toBe(uuid(1))
    expect(parseAsUuid().parse(uuid(7))).toBe(uuid(7))
    expect(parseAsUuid().parse(uuid().toUpperCase())).toBe(uuid().toUpperCase())
  })

  it('accepts nil and max UUIDs only when no version is specified', () => {
    expect(parseAsUuid().parse(nilUuid)).toBe(nilUuid)
    expect(parseAsUuid().parse(maxUuid)).toBe(maxUuid)
    expect(parseAsUuid({ version: 4 }).parse(nilUuid)).toBeNull()
    expect(parseAsUuid({ version: 4 }).parse(maxUuid)).toBeNull()
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)(
    'accepts only UUID version %s when specified',
    version => {
      expect(parseAsUuid({ version }).parse(uuid(version))).toBe(uuid(version))
      expect(parseAsUuid({ version }).parse(uuid(version === 1 ? 4 : 1))).toBe(
        null
      )
    }
  )

  it('is bijective', () => {
    const parser = parseAsUuid()
    const v4 = parseAsUuid({ version: 4 })
    expect(testParseThenSerialize(parser, uuid())).toBe(true)
    expect(testSerializeThenParse(parser, uuid())).toBe(true)
    expect(isParserBijective(parser, uuid(), uuid())).toBe(true)
    expect(testParseThenSerialize(v4, uuid(4))).toBe(true)
    expect(testSerializeThenParse(v4, uuid(4))).toBe(true)
    expect(isParserBijective(v4, uuid(4), uuid(4))).toBe(true)
  })

  it('has the expected types', () => {
    const p = parseAsUuid()
    assertType<string | null>(p.parse('550e8400-e29b-41d4-a716-446655440000'))
    assertType<string>(p.serialize('550e8400-e29b-41d4-a716-446655440000'))
    assertType<string | null>(p.parseServerSide(undefined))
    const v4 = parseAsUuid({ version: 4 })
    assertType<string | null>(v4.parse('550e8400-e29b-41d4-a716-446655440000'))
    // @ts-expect-error -- only UUID versions 1-8 are allowed
    parseAsUuid({ version: 123 })
  })
})
