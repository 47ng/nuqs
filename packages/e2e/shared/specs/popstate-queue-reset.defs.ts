import { createSerializer, parseAsInteger, parseAsString } from 'nuqs/server'

export const searchParams = {
  a: parseAsInteger.withDefault(0),
  b: parseAsInteger.withDefault(0),
  c: parseAsInteger.withDefault(0)
}

export const controlSearchParams = {
  debounceTime: parseAsInteger.withDefault(500),
  value: parseAsString.withDefault('')
}

export const getUrl = createSerializer(controlSearchParams, {
  clearOnDefault: false
})
