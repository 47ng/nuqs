import fc from 'fast-check'
import { describe, expect, test, vi } from 'vitest'
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
  test('Characters that break URLs are encoded', () => {
    expect(encodeQueryValue('"')).toEqual(encodeURIComponent('"'))
    expect(encodeQueryValue("'")).toEqual('%27') // encodeURIComponent does not encode single quotes
    expect(encodeQueryValue('`')).toEqual(encodeURIComponent('`'))
    expect(encodeQueryValue('<')).toEqual(encodeURIComponent('<'))
    expect(encodeQueryValue('>')).toEqual(encodeURIComponent('>'))
  })
  test('hidden ASCII characters are encoded', () => {
    const chars = Array.from({ length: 32 }, (_, i) => String.fromCharCode(i))
    chars.forEach(char => {
      expect(encodeQueryValue(char)).toBe(encodeURIComponent(char))
    })
  })
  test('Alphanumericals are passed through', () => {
    const input = 'abcdefghijklmnopqrstuvwxyz0123456789'
    expect(encodeQueryValue(input)).toBe(input)
  })
  test('Other special characters are passed through', () => {
    const input = '-._~!$()*,;=:@/[]'
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

  test.each([
    { label: 'ASCII', unit: 'binary-ascii' },
    { label: 'Printable characters', unit: 'grapheme' },
    { label: 'Full Unicode range', unit: 'binary' },
    {
      label: 'Special ASCII characters',
      unit: fc.constantFrom(...'-._~!$()*,;=:@/?[]{}\\|^')
    }
  ] as const)('Property-based fuzzy testing - $label', ({ unit }) => {
    fc.assert(
      fc.property(fc.string({ unit }), str => {
        const search = `?key=${encodeQueryValue(str)}`
        const expected = new URLSearchParams(search).get('key')
        expect(expected).toBe(str)
      })
    )
  })
})

describe('url-encoding/renderQueryString', () => {
  test('empty query', () => {
    expect(renderQueryString(new URLSearchParams())).toBe('')
  })
  test('simple key-value pair', () => {
    const search = new URLSearchParams()
    search.set('foo', 'bar')
    expect(renderQueryString(search)).toBe('?foo=bar')
  })
  test('encoding', () => {
    const search = new URLSearchParams()
    search.set('test', '-._~!$()*,;=:@/?[]{}\\|^')
    expect(renderQueryString(search)).toBe(
      '?test=-._~!$()*,;=:@/%3F[]%7B%7D%5C%7C%5E'
    )
  })
  test('decoding', () => {
    const search = new URLSearchParams()
    const value = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
    search.set('test', value)
    const url = new URL('http://example.com' + renderQueryString(search))
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding plus and spaces', () => {
    const search = new URLSearchParams()
    const value = 'a b+c'
    search.set('test', value)
    const url = new URL('http://example.com' + renderQueryString(search))
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding hashes and fragment', () => {
    const search = new URLSearchParams()
    const value = 'foo#bar'
    search.set('test', value)
    const url = new URL(
      'http://example.com' + renderQueryString(search) + '#egg'
    )
    expect(url.searchParams.get('test')).toBe(value)
  })
  test('decoding ampersands', () => {
    const search = new URLSearchParams()
    const value = 'a&b=c'
    search.set('test', value)
    const url = new URL(
      'http://example.com' + renderQueryString(search) + '&egg=spam'
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
      '?name=John+Doe&email=foo.bar%2Begg-spam@example.com&message=Hello,+world!+%23greeting'
    )
  })
  test('practical use-cases', () => {
    // https://github.com/47ng/nuqs/issues/355
    {
      const value =
        'leftOfBicycleLane:car_lanes,curb|pavementHasShops:true|pavementWidth:narrow'
      const search = new URLSearchParams()
      search.set('filter', value)
      const query = renderQueryString(search)
      expect(query.slice('?filter='.length)).toBe(
        'leftOfBicycleLane:car_lanes,curb%7CpavementHasShops:true%7CpavementWidth:narrow'
      )
    }
    {
      const url = new URL(
        'https://radverkehrsatlas.de/regionen/trto?lat=53.6774&lng=13.267&zoom=10.6&theme=fromTo&bg=default&config=!(i~fromTo~topics~!(i~shops~s~!(i~hidden~a~_F)(i~default~a))(i~education~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~buildings~s~!(i~hidden~a)(i~default~a~_F))(i~landuse~s~!(i~hidden~a~_F)(i~default~a))(i~barriers~s~!(i~hidden~a~_F)(i~default~a))(i~boundaries~s~!(i~hidden~a)(i~default~a~_F)(i~level-8~a~_F)(i~level-9-10~a~_F)))(i~bikelanes~topics~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~verification~a~_F)(i~completeness~a~_F))(i~bikelanesPresence*_legacy~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~roadClassification~topics~!(i~roadClassification*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~oneway~a~_F))(i~bikelanes~s~!(i~hidden~a)(i~default~a~_F)(i~verification~a~_F)(i~completeness~a~_F))(i~maxspeed*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~details~a~_F))(i~surfaceQuality*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~bad~a~_F)(i~completeness~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~lit~topics~!(i~lit*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~completeness~a~_F)(i~verification~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a)(i~default~a~_F)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))~'
      )
      const search = renderQueryString(url.searchParams)
      expect(search).toBe(url.search)
    }
  })
  test('keys with special characters get escaped', () => {
    const search = new URLSearchParams()
    search.set('a &b?c=d#e%f+g"h\'i`j<k>l(m)n*o,p.q:r;s/t', 'value')
    expect(renderQueryString(search)).toBe(
      '?a %26b%3Fc%3Dd%23e%f%2Bg"h\'i`j<k>l(m)n*o,p.q:r;s/t=value'
    )
  })
  test('emits a warning if the URL is too long', () => {
    const search = new URLSearchParams()
    search.set('a', 'a'.repeat(2000))
    const warn = console.warn
    console.warn = vi.fn()
    renderQueryString(search)
    expect(console.warn).toHaveBeenCalledTimes(1)
    console.warn = warn
  })
})

test.skip('encodeURI vs encodeURIComponent vs custom encoding', () => {
  const chars = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'.split('')
  const table = chars.map(char => ({
    char,
    encodeQueryValue: encodeQueryValue(char),
    encodeURI: encodeURI(char),
    encodeURIComponent: encodeURIComponent(char)
  }))
  console.table(table)
})
