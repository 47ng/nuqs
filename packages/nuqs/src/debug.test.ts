import { describe, expect, it } from 'vitest'
import { sprintf } from './debug'

describe('debug/sprintf', () => {
  it('formats strings with %s', () => {
    expect(sprintf('%s', 'foo')).toBe('foo')
    expect(sprintf('%s', 1)).toBe('1')
    expect(sprintf('%s', true)).toBe('true')
    expect(sprintf('%s', null)).toBe('null')
    expect(sprintf('%s', undefined)).toBe('undefined')
    expect(sprintf('%s', {})).toBe('[object Object]')
    expect(sprintf('%s', [])).toBe('')
  })
  it('formats integers with %d', () => {
    expect(sprintf('%d', 1)).toBe('1')
    expect(sprintf('%d', 1.5)).toBe('1.5')
    expect(sprintf('%d', '1')).toBe('1')
    expect(sprintf('%d', '1.5')).toBe('1.5')
    expect(sprintf('%d', true)).toBe('true')
    expect(sprintf('%d', false)).toBe('false')
    expect(sprintf('%d', null)).toBe('null')
    expect(sprintf('%d', undefined)).toBe('undefined')
    expect(sprintf('%d', {})).toBe('[object Object]')
    expect(sprintf('%d', [])).toBe('')
  })
  it('formats floats with %f', () => {
    expect(sprintf('%f', 1)).toBe('1')
    expect(sprintf('%f', 1.5)).toBe('1.5')
    expect(sprintf('%f', '1')).toBe('1')
    expect(sprintf('%f', '1.5')).toBe('1.5')
    expect(sprintf('%f', true)).toBe('true')
    expect(sprintf('%f', false)).toBe('false')
    expect(sprintf('%f', null)).toBe('null')
    expect(sprintf('%f', undefined)).toBe('undefined')
    expect(sprintf('%f', {})).toBe('[object Object]')
    expect(sprintf('%f', [])).toBe('')
  })
  it('formats objects with %O', () => {
    expect(sprintf('%O', 'foo')).toBe('"foo"')
    expect(sprintf('%O', 1)).toBe('1')
    expect(sprintf('%O', true)).toBe('true')
    expect(sprintf('%O', null)).toBe('null')
    expect(sprintf('%O', undefined)).toBe('undefined')
    expect(sprintf('%O', {})).toBe('{}')
    expect(sprintf('%O', [])).toBe('[]')
    expect(sprintf('%O', { hello: 'world' })).toBe('{hello:"world"}')
  })
  it('formats multiple arguments', () => {
    expect(sprintf('%s %O', 'foo', { hello: 'world' })).toBe(
      'foo {hello:"world"}'
    )
    expect(sprintf('%O %s', { hello: 'world' }, 'foo')).toBe(
      '{hello:"world"} foo'
    )
  })
  it('supports mismatching numbers of arguments and placeholders', () => {
    expect(sprintf('%s %s', 'foo')).toBe('foo undefined')
    expect(sprintf('%s %s', 'foo', 'bar', 'baz')).toBe('foo bar')
  })
})
