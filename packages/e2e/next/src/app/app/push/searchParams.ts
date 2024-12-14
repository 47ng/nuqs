import { parseAsInteger } from 'nuqs/server'
import { createSearchParamsCache } from 'nuqs/server/cache'

export const parser = parseAsInteger.withDefault(0).withOptions({
  history: 'push'
})
export const searchParamsCache = createSearchParamsCache({
  server: parser
})
