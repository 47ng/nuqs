import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum
} from 'nuqs/server'

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(5),
  order: parseAsStringEnum(['asc', 'desc']),
  search: parseAsString.withDefault('')
}

export const searchParamsCache = createSearchParamsCache(searchParams)

export const serialize = createSerializer(searchParams)
