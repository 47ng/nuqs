import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/parsers'

export const renderingOptions = ['server', 'client'] as const
export type RenderingOptions = (typeof renderingOptions)[number]

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  renderOn: parseAsStringLiteral(renderingOptions).withDefault('server'),
  delay: parseAsInteger.withDefault(0)
}

export const searchParamsCache = createSearchParamsCache(searchParams)
