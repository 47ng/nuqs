import { describe, expect, test } from 'vitest'
import { encodeQueryValue, renderQueryString } from './url-encoding'

describe('url-encoding/encodeQueryValue', () => {
  test('spaces are encoded as +', () => {
    expect(encodeQueryValue(' ')).toBe('+')
  })
  test('+ are encoded', () => {
    expect(encodeQueryValue('+')).toBe(encodeURIComponent('+'))
  })
  test('Hashes are encoded', () => {
    expect(encodeQueryValue('#')).toBe(encodeURIComponent('#'))
  })
  test('Ampersands are encoded', () => {
    expect(encodeQueryValue('&')).toBe(encodeURIComponent('&'))
  })
  test('Percent signs are encoded', () => {
    expect(encodeQueryValue('%')).toBe(encodeURIComponent('%'))
  })
  test('Alphanumericals are passed through', () => {
    const input = 'abcdefghijklmnopqrstuvwxyz0123456789'
    expect(encodeQueryValue(input)).toBe(input)
  })
  test('Other special characters are passed through', () => {
    const input = '-._~!$\'()*,;=:@"/?`[]{}\\|<>^'
    expect(encodeQueryValue(input)).toBe(input)
  })
  test('practical use-cases', () => {
    const e = encodeQueryValue
    expect(e('a b')).toBe('a+b')
    expect(e('some#secret')).toBe('some%23secret')
    expect(e('2+2=5')).toBe('2%2B2=5')
    expect(e('100%')).toBe('100%25')
    expect(e('kool&thegang')).toBe('kool%26thegang')
    expect(e('a&b=c')).toBe('a%26b=c')
  })
})

describe('url-encoding/renderQueryString', () => {
  test('empty query', () => {
    expect(renderQueryString(new URLSearchParams())).toBe('')
  })
  test('simple key-value pair', () => {
    const search = new URLSearchParams()
    search.set('foo', 'bar')
    expect(renderQueryString(search)).toBe('foo=bar')
  })
  test('encoding', () => {
    const search = new URLSearchParams()
    search.set('test', '-._~!$\'()*,;=:@"/?`[]{}\\|<>^')
    expect(renderQueryString(search)).toBe(
      'test=-._~!$\'()*,;=:@"/?`[]{}\\|<>^'
    )
  })
  test('decoding', () => {
    const search = new URLSearchParams()
    const value = '-._~!$\'()*,;=:@"/?`[]{}\\|<>^'
    search.set('test', value)
    const url = new URL('http://example.com/?' + renderQueryString(search))
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding plus and spaces', () => {
    const search = new URLSearchParams()
    const value = 'a b+c'
    search.set('test', value)
    const url = new URL('http://example.com/?' + renderQueryString(search))
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding hashes and fragment', () => {
    const search = new URLSearchParams()
    const value = 'foo#bar'
    search.set('test', value)
    const url = new URL(
      'http://example.com/?' + renderQueryString(search) + '#egg'
    )
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding ampersands', () => {
    const search = new URLSearchParams()
    const value = 'a&b=c'
    search.set('test', value)
    const url = new URL(
      'http://example.com/?' + renderQueryString(search) + '&egg=spam'
    )
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('it renders query string with special characters', () => {
    const search = new URLSearchParams()
    search.set('name', 'John Doe')
    search.set('email', 'foo.bar+egg-spam@example.com')
    search.set('message', 'Hello, world! #greeting')
    const query = renderQueryString(search)
    expect(query).toBe(
      'name=John+Doe&email=foo.bar%2Begg-spam@example.com&message=Hello,+world!+%23greeting'
    )
  })
})
