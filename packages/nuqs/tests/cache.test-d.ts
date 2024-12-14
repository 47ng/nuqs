import { assertType, describe, expectTypeOf, it } from 'vitest'
import { parseAsBoolean, parseAsInteger, parseAsString } from '../dist/server'
import { createSearchParamsCache } from '../dist/server/cache'

describe('types/cache', () => {
  const cache = createSearchParamsCache({
    foo: parseAsString,
    bar: parseAsInteger,
    egg: parseAsBoolean.withDefault(false)
  })
  type All = Readonly<{ foo: string | null; bar: number | null; egg: boolean }>

  it('has a type-safe `parse` method that returns all entries', () => {
    assertType<All>(cache.parse({}))
  })

  it('has a type-safe `all` method that returns all entries', () => {
    assertType<All>(cache.all())
  })

  it('has a type-safe `get` method that returns a single entry', () => {
    const cache = createSearchParamsCache({
      foo: parseAsString,
      bar: parseAsInteger,
      egg: parseAsBoolean.withDefault(false)
    })
    assertType<string | null>(cache.get('foo'))
    assertType<number | null>(cache.get('bar'))
    assertType<boolean>(cache.get('egg'))
    expectTypeOf(cache.get('egg')).not.toBeNull()
    expectTypeOf(cache.get('foo')).not.toBeUndefined()
    expectTypeOf(cache.get('bar')).not.toBeUndefined()
    expectTypeOf(cache.get('egg')).not.toBeUndefined()

    // @ts-expect-error
    assertType(cache.get('spam'))
  })

  it('supports async search params (Next.js 15+)', () => {
    const cache = createSearchParamsCache({
      foo: parseAsString,
      bar: parseAsInteger,
      egg: parseAsBoolean.withDefault(false)
    })
    // Only `parse` is async, getters are unwrapped
    assertType<Promise<All>>(cache.parse(Promise.resolve({})))
    assertType<All>(cache.all())
    assertType<string | null>(cache.get('foo'))
    assertType<number | null>(cache.get('bar'))
    assertType<boolean>(cache.get('egg'))
  })

  it('supports urlKeys', () => {
    createSearchParamsCache(
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
    createSearchParamsCache(
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
    createSearchParamsCache(
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
    createSearchParamsCache(
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
