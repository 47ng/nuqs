import { createSearchParamsCache, parseAsString } from 'nuqs/server'

export const searchParams = {
  injected: parseAsString.withDefault('null'),
  through: parseAsString.withDefault('null')
}

export const cache = createSearchParamsCache(searchParams)
