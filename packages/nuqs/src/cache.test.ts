import { describe, expect, it, vi } from 'vitest'
import { compareSearchParams, createSearchParamsCache } from './cache'
import { parseAsString } from './parsers'

// provide a simple mock for React cache
vi.mock('react', () => {
  return {
    cache<T, CachedFunction extends () => T>(fn: CachedFunction) {
      let cache: T | undefined = undefined
      function cachedFn() {
        cache ??= fn()
        return cache
      }
      return cachedFn
    }
  }
})

describe('cache', () => {
  describe('createSearchParamsCache', () => {
    const input = {
      string: "I'm a string"
    }

    it('allows parsing the same object multiple times in a request', () => {
      const cache = createSearchParamsCache({
        string: parseAsString
      })

      // parse the input and perform some sanity checks
      expect(cache.parse(input).string).toBe(input.string)
      const all = cache.all()
      expect(all.string).toBe(input.string)

      // second call should be successful and return the same result
      expect(cache.parse(input).string).toBe(input.string)
      expect(cache.all()).toBe(all)
    })

    it('allows parsing the same content with different references', () => {
      const cache = createSearchParamsCache({
        string: parseAsString
      })
      const copy = { ...input }
      expect(cache.parse(input).string).toBe(input.string)
      expect(cache.parse(copy).string).toBe(input.string)
    })

    it('disallows parsing different objects in a request', () => {
      const cache = createSearchParamsCache({
        string: parseAsString
      })
      expect(cache.parse(input).string).toBe(input.string)
      const all = cache.all()

      // second call with different object should fail
      expect(() => cache.parse({ string: 'I am a different string' })).toThrow()

      // cache still works though
      expect(cache.all()).toBe(all)
    })

    it('supports urlKeys', () => {
      const cache = createSearchParamsCache(
        {
          string: parseAsString
        },
        {
          urlKeys: {
            string: 'str'
          }
        }
      )
      const parseOutput = cache.parse({
        str: 'this one is used',
        string: 'not this one'
      })
      expect(parseOutput.string).toBe('this one is used')
      // @ts-expect-error - Making sure types & runtime are in sync
      expect(parseOutput.str).toBeUndefined()
      expect(cache.all().string).toBe('this one is used')
      expect(cache.get('string')).toBe('this one is used')
    })

    it('supports partial urlKeys', () => {
      const cache = createSearchParamsCache(
        {
          foo: parseAsString,
          bar: parseAsString
        },
        {
          urlKeys: {
            foo: 'f'
          }
        }
      )
      const parseOutput = cache.parse({
        f: 'foo',
        bar: 'bar'
      })
      expect(parseOutput.foo).toBe('foo')
      expect(parseOutput.bar).toBe('bar')
    })

    it('supports a Promise as input', async () => {
      const cache = createSearchParamsCache({
        string: parseAsString
      })
      expect((await cache.parse(Promise.resolve(input))).string).toBe(
        input.string
      )
      const all = cache.all()
      expect(all.string).toBe(input.string)
    })
  })

  describe('compareSearchParams', () => {
    it('works on empty search params', () => {
      expect(compareSearchParams({}, {})).toBe(true)
    })
    it('rejects different lengths', () => {
      expect(compareSearchParams({ a: 'a' }, { a: 'a', b: 'b' })).toBe(false)
    })
    it('rejects different values', () => {
      expect(compareSearchParams({ x: 'a' }, { x: 'b' })).toBe(false)
    })
    it('does not care about order', () => {
      expect(compareSearchParams({ x: 'a', y: 'b' }, { y: 'b', x: 'a' })).toBe(
        true
      )
    })
    it('supports array values (referentially stable)', () => {
      const array = ['a', 'b']
      expect(compareSearchParams({ x: array }, { x: array })).toBe(true)
    })
    it('does not do deep comparison', () => {
      expect(compareSearchParams({ x: ['a', 'b'] }, { x: ['a', 'b'] })).toBe(
        false
      )
    })
  })
})
