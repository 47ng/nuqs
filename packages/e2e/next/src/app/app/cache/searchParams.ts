import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsIndex,
  parseAsString
} from 'nuqs/server'

export const parsers = {
  str: parseAsString,
  num: parseAsInteger,
  idx: parseAsIndex,
  bool: parseAsBoolean,
  def: parseAsString.withDefault('default'),
  nope: parseAsString
}

export const cache = createSearchParamsCache(parsers)
