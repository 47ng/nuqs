import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from 'nuqs/server'

export const parsers = {
  str: parseAsString,
  num: parseAsInteger,
  bool: parseAsBoolean,
  def: parseAsString.withDefault('default'),
  nope: parseAsString
}

export const cache = createSearchParamsCache(parsers)
