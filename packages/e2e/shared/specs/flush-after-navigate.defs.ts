import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server'

export const searchParams = {
  debounce: parseAsInteger,
  throttle: parseAsInteger,
  linkState: parseAsString
}

export const loadSearchParams = createLoader(searchParams)
export const getUrl = createSerializer(searchParams)
