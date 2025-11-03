import { useQueryState, useQueryStates } from 'nuqs'
import {
  createLoader,
  createSerializer,
  type inferParserType,
  type Options,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/server'

export const renderingOptions = ['server', 'client'] as const
export type RenderingOptions = (typeof renderingOptions)[number]

const searchParams = {
  page: parseAsInteger.withDefault(1),
  renderOn: parseAsStringLiteral(renderingOptions).withDefault('server'),
  delay: parseAsInteger.withDefault(0)
}
export type PaginationSearchParams = inferParserType<typeof searchParams>

export const usePage = (options: Options = {}) =>
  useQueryState(
    'page',
    searchParams.page.withOptions({ ...options, shallow: false })
  )

export const usePaginationControls = () =>
  useQueryStates(searchParams, { shallow: false })

export const loadPagination = createLoader(searchParams)
export const getPaginatedLink = createSerializer(searchParams)
