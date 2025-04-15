import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server'

export const searchParams = {
  debounce: parseAsInteger,
  throttle: parseAsInteger,
  linkState: parseAsString,
  linkPath: parseAsStringLiteral(['/end', '/start']).withDefault('/end')
}

export const loadSearchParams = createLoader(searchParams)
export const getUrl = createSerializer(searchParams)
