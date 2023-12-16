import {
  createSearchParamsCache,
  parseAsString
} from 'next-usequerystate/parsers'

export const searchParams = {
  injected: parseAsString.withDefault('null'),
  through: parseAsString.withDefault('null')
}

export const cache = createSearchParamsCache(searchParams)
