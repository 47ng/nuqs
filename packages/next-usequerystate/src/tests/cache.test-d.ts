import { expectError, expectNotAssignable, expectType } from 'tsd'
import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from '../../dist/parsers'

{
  const cache = createSearchParamsCache({
    foo: parseAsString,
    bar: parseAsInteger,
    egg: parseAsBoolean.withDefault(false)
  })
  // Values are type-safe
  expectType<string | null>(cache.get('foo'))
  expectType<number | null>(cache.get('bar'))
  // Default values are taken into account
  expectType<boolean>(cache.get('egg'))
  expectNotAssignable<null>(cache.get('egg'))
  // Keys are type safe
  expectError(() => {
    cache.get('spam')
  })
  expectType<
    Readonly<{ foo: string | null; bar: number | null; egg: boolean }>
  >(cache.all())
}
