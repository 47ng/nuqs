import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsStringLiteral
} from 'nuqs'

export const optionsSearchParams = {
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['replace', 'push']).withDefault('replace')
}

export const getOptionsUrl = createSerializer(optionsSearchParams)
export const loadOptions = createLoader(optionsSearchParams)
