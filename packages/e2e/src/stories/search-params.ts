import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString
} from 'nuqs/server'

export const searchParamsCache = createSearchParamsCache({
  foo: parseAsString,
  bar: parseAsInteger.withDefault(0)
})
