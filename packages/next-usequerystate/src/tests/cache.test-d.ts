import { expectError, expectNotAssignable, expectType } from 'tsd'
import {
  createSearchParamCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from '../../dist/parsers'

{
  const { getSearchParam } = createSearchParamCache({
    foo: parseAsString,
    bar: parseAsInteger,
    egg: parseAsBoolean.withDefault(false)
  })
  // Values are type-safe
  expectType<string | null>(getSearchParam('foo'))
  expectType<number | null>(getSearchParam('bar'))
  // Default values are taken into account
  expectType<boolean>(getSearchParam('egg'))
  expectNotAssignable<null>(getSearchParam('egg'))
  // Keys are type safe
  expectError(() => {
    getSearchParam('spam')
  })
}
