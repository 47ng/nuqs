import {
  createLoader,
  type inferParserType,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/server'

const params = {
  hook: parseAsStringLiteral([
    'useQueryState',
    'useQueryStates'
  ] as const).withDefault('useQueryState'),
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['push', 'replace'] as const).withDefault(
    'replace'
  ),
  startTransition: parseAsBoolean.withDefault(false)
}

const searchParams = {
  delay: parseAsInteger.withDefault(0)
}

export type Params = inferParserType<typeof params>
export type SearchParams = inferParserType<typeof searchParams>

export const loadParams = createLoader(params)
export const loadSearchParams = createLoader(searchParams)
