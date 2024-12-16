import { createSerializer, parseAsBoolean, parseAsStringLiteral } from 'nuqs'

export const shallowSearchParams = {
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['replace', 'push']).withDefault('replace')
}

export const getShallowUrl = createSerializer(shallowSearchParams)
