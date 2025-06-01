import {
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs/server'

const parser = parseAsInteger.withDefault(0)

export const searchParams = {
  a: parser,
  b: parser,
  c: parser
}

export const optionsSearchParams = {
  hook: parseAsStringLiteral([
    'useQueryState',
    'useQueryStates'
  ] as const).withDefault('useQueryState'),
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['push', 'replace'] as const).withDefault(
    'replace'
  )
}

export const getUrl = createSerializer(optionsSearchParams, {
  clearOnDefault: false
})
