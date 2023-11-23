import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from 'next-usequerystate/parsers'

export const parsers = {
  str: parseAsString,
  num: parseAsInteger,
  bool: parseAsBoolean,
  def: parseAsString.withDefault('default'),
  nope: parseAsString
}

export const cache = createSearchParamsCache(parsers)
