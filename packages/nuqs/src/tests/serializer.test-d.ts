import { assertType, describe, it } from 'vitest'
import { createSerializer, parseAsInteger, parseAsString } from '../../dist'

describe('types/serializer', () => {
  const serialize = createSerializer({
    foo: parseAsString,
    bar: parseAsInteger
  })
  it('returns a string', () => {
    assertType<string>(serialize({}))
    assertType<string>(serialize({ foo: 'foo', bar: 42 }))
    assertType<string>(serialize({ foo: null, bar: null }))
  })
  // prettier-ignore
  it('accepts a base', () => {
    assertType<string>(serialize('/', {}))
    assertType<string>(serialize('/', { foo: 'foo', bar: 42 }))
    assertType<string>(serialize('/', { foo: null, bar: null }))
    assertType<string>(serialize(new URLSearchParams(), {}))
    assertType<string>(serialize(new URLSearchParams(), { foo: 'foo', bar: 42 }))
    assertType<string>(serialize(new URLSearchParams(), { foo: null, bar: null }))
    assertType<string>(serialize(new URL('https://example.com'), {}))
    assertType<string>(serialize(new URL('https://example.com'), { foo: 'foo', bar: 42 }))
    assertType<string>(serialize(new URL('https://example.com'), { foo: null, bar: null }))
  })
  it('allows clearing from the base', () => {
    assertType<string>(serialize('/', null))
    assertType<string>(serialize(new URLSearchParams(), null))
    assertType<string>(serialize(new URL('https://example.com'), null))
  })
  it('accepts partial inputs', () => {
    assertType<string>(serialize({ foo: 'foo' }))
    assertType<string>(serialize({ bar: 42 }))
  })
  it("doesn't accept extra properties", () => {
    // @ts-expect-error
    assertType(serialize({ nope: null }))
  })
  it('accepts null | undefined for values', () => {
    assertType<string>(serialize({ foo: null }))
    assertType<string>(serialize({ foo: undefined }))
    assertType<string>(serialize({ bar: null }))
    assertType<string>(serialize({ bar: undefined }))
  })
  it('supports urlKeys', () => {
    createSerializer(
      {
        foo: parseAsString,
        bar: parseAsInteger
      },
      {
        urlKeys: {
          foo: 'f'
          // It accepts partial inputs
        }
      }
    )
    createSerializer(
      {
        foo: parseAsString,
        bar: parseAsInteger
      },
      {
        urlKeys: {
          foo: 'f',
          bar: 'b'
        }
      }
    )
    createSerializer(
      {
        foo: parseAsString,
        bar: parseAsInteger
      },
      {
        urlKeys: {
          // @ts-expect-error
          nope: 'n' // Doesn't accept extra properties
        }
      }
    )
  })
})
