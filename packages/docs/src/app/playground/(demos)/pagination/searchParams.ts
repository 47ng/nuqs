import {
  createSerializer,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/server'
import { createSearchParamsCache } from 'nuqs/server/cache'

export const renderingOptions = ['server', 'client'] as const
export type RenderingOptions = (typeof renderingOptions)[number]

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  renderOn: parseAsStringLiteral(renderingOptions).withDefault('server'),
  delay: parseAsInteger.withDefault(0)
}

export const searchParamsCache = createSearchParamsCache(searchParams)
export const serialize = createSerializer(searchParams)
