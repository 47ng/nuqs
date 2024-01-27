import { describe, expect, test } from 'vitest'
import { parseAsBoolean, parseAsInteger, parseAsString } from './parsers'
import { createSerializer } from './serialize'

const parsers = {
  str: parseAsString,
  int: parseAsInteger,
  bool: parseAsBoolean
}

describe('serialize', () => {
  test('empty', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({})
    expect(result).toBe('')
  })
  test('one item', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo' })
    expect(result).toBe('?str=foo')
  })
  test('several items', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo', int: 1, bool: true })
    expect(result).toBe('?str=foo&int=1&bool=true')
  })
  test("null items don't show up", () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: null })
    expect(result).toBe('')
  })
})
