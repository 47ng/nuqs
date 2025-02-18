import { parseAsString } from 'nuqs/server'
import { createSearchParamsCache } from 'nuqs/server/cache'

export const searchParams = {
  injected: parseAsString.withDefault('null'),
  through: parseAsString.withDefault('null')
}

export const cache = createSearchParamsCache(searchParams)
