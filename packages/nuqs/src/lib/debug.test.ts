import { describe, expect, test } from 'vitest'
import { sprintf } from './debug'

describe('debug/sprintf', () => {
  test('%s', () => {
    expect(sprintf('%s', 'foo')).toBe('foo')
    expect(sprintf('%s', 1)).toBe('1')
    expect(sprintf('%s', true)).toBe('true')
    expect(sprintf('%s', null)).toBe('null')
    expect(sprintf('%s', undefined)).toBe('undefined')
    expect(sprintf('%s', {})).toBe('[object Object]')
    expect(sprintf('%s', [])).toBe('')
  })
  test('%O', () => {
    expect(sprintf('%O', 'foo')).toBe('"foo"')
    expect(sprintf('%O', 1)).toBe('1')
    expect(sprintf('%O', true)).toBe('true')
    expect(sprintf('%O', null)).toBe('null')
    expect(sprintf('%O', undefined)).toBe('undefined')
    expect(sprintf('%O', {})).toBe('{}')
    expect(sprintf('%O', [])).toBe('[]')
    expect(sprintf('%O', { hello: 'world' })).toBe('{hello:"world"}')
  })
  test('All together now', () => {
    expect(sprintf('%s %O', 'foo', { hello: 'world' })).toBe(
      'foo {hello:"world"}'
    )
    expect(sprintf('%O %s', { hello: 'world' }, 'foo')).toBe(
      '{hello:"world"} foo'
    )
  })
})
