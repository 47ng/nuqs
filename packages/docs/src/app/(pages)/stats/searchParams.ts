import { createLoader, parseAsBoolean, parseAsStringLiteral } from 'nuqs/server'

export const pkgOptions = ['nuqs', 'next-usequerystate', 'both'] as const
export const pkgParser = parseAsStringLiteral(pkgOptions).withDefault('nuqs')

export const searchParams = {
  pkg: pkgParser,
  beta: parseAsBoolean.withDefault(false)
}

export const loadSearchParams = createLoader(searchParams)
