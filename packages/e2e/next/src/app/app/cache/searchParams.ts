import {
  parseAsBoolean,
  parseAsIndex,
  parseAsInteger,
  parseAsString
} from 'nuqs/server'
import { createSearchParamsCache } from 'nuqs/server/cache'

export const parsers = {
  str: parseAsString,
  num: parseAsInteger,
  idx: parseAsIndex,
  bool: parseAsBoolean,
  def: parseAsString.withDefault('default'),
  nope: parseAsString
}

export const cache = createSearchParamsCache(parsers)
