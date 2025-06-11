import { createLoader, parseAsInteger, parseAsString } from 'nuqs/server'

export const searchParams = {
  name: parseAsString.withDefault(''),
  count: parseAsInteger.withDefault(0)
}

export const loadSearchParams = createLoader(searchParams)
