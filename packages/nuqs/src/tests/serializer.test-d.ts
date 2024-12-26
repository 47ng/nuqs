import { expectError, expectType } from 'tsd'
import { createSerializer, parseAsInteger, parseAsString } from '../../dist'

// prettier-ignore
{
  const serialize = createSerializer({
    foo: parseAsString,
    bar: parseAsInteger
  })
  // It returns a string
  expectType<string>(serialize({}))
  expectType<string>(serialize({ foo: 'foo', bar: 42 }))
  expectType<string>(serialize({ foo: null, bar: null }))
  // With base
  expectType<string>(serialize('/', {}))
  expectType<string>(serialize('/', { foo: 'foo', bar: 42 }))
  expectType<string>(serialize('/', { foo: null, bar: null }))
  expectType<string>(serialize(new URLSearchParams(), {}))
  expectType<string>(serialize(new URLSearchParams(), { foo: 'foo', bar: 42 }))
  expectType<string>(serialize(new URLSearchParams(), { foo: null, bar: null }))
  expectType<string>(serialize(new URL('https://example.com'), {}))
  expectType<string>(serialize(new URL('https://example.com'), { foo: 'foo', bar: 42 }))
  expectType<string>(serialize(new URL('https://example.com'), { foo: null, bar: null }))
  // Clearing from base
  expectType<string>(serialize('/', null))
  expectType<string>(serialize(new URLSearchParams(), null))
  expectType<string>(serialize(new URL('https://example.com'), null))
}

// It accepts partial inputs
{
  const serialize = createSerializer({
    foo: parseAsString,
    bar: parseAsInteger
  })

  expectType<string>(serialize({ foo: 'foo' }))
  expectType<string>(serialize({ bar: 42 }))
}

// It doesn't accept extra properties
{
  const serialize = createSerializer({
    foo: parseAsString,
    bar: parseAsInteger
  })
  expectError(() => {
    serialize({ nope: null })
  })
}

// It accepts null for values
{
  const serialize = createSerializer({
    foo: parseAsInteger,
    bar: parseAsInteger.withDefault(0)
  })
  // Should accept number | null | undefined
  expectType<string>(serialize({ foo: null }))
  expectType<string>(serialize({ foo: undefined }))
  expectType<string>(serialize({ bar: null }))
  expectType<string>(serialize({ bar: undefined }))
}

// It supports urlKeys
{
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
  expectError(() => {
    createSerializer(
      {
        foo: parseAsString,
        bar: parseAsInteger
      },
      {
        urlKeys: {
          nope: 'n' // Doesn't accept extra properties
        }
      }
    )
  })
}
