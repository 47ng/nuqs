import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from 'next-usequerystate/parsers'

export const cache = createSearchParamsCache({
  str: parseAsString,
  num: parseAsInteger,
  bool: parseAsBoolean,
  def: parseAsString.withDefault('default'),
  nope: parseAsString
})
