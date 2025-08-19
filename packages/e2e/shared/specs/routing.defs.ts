import {
  createSerializer,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs'

export const routingSearchParams = {
  state: parseAsString,
  shallow: parseAsBoolean.withDefault(true),
  method: parseAsStringLiteral(['push', 'replace']).withDefault('replace')
}
export const routingUrlKeys = {
  state: 'test',
  method: 'router'
}

export const getRoutingUrl = createSerializer(routingSearchParams, {
  urlKeys: routingUrlKeys
})
