import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server'

export const searchParams = {
  debounce: parseAsInteger,
  throttle: parseAsInteger,
  linkState: parseAsString,
  history: parseAsStringLiteral(['push', 'replace']).withDefault('replace'),
  shallow: parseAsBoolean.withDefault(true),
  linkPath: parseAsStringLiteral(['/end', '/start']).withDefault('/end')
}

export const testSearchParams = {
  test: parseAsString
}

export const loadSearchParams = createLoader(searchParams)
export const getUrl = createSerializer(searchParams)
