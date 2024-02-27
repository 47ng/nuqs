import { createSearchParamsCache, parseAsStringLiteral } from 'nuqs/server'

export const pkgOptions = ['nuqs', 'next-usequerystate', 'both'] as const
export const pkgParser = parseAsStringLiteral(pkgOptions).withDefault('both')

export const searchParamsCache = createSearchParamsCache({
  pkg: pkgParser
})
