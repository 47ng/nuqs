import { createSearchParamsCache, parseAsInteger } from 'nuqs/server'

export const parser = parseAsInteger.withDefault(0).withOptions({
  history: 'push'
})
export const searchParamsCache = createSearchParamsCache({
  server: parser
})
