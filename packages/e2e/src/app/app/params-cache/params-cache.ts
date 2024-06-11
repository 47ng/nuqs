import { createSearchParamsCache, parseAsInteger } from 'nuqs/server'

export const paramsCache = createSearchParamsCache({
  slug: parseAsInteger.withDefault(NaN)
})
