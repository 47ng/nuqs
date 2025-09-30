import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsStringLiteral,
  useQueryStates
} from 'nuqs'

export const optionsSearchParams = {
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['replace', 'push']).withDefault('replace')
}
export const useOptions = () => useQueryStates(optionsSearchParams)[0]
export const getOptionsUrl = createSerializer(optionsSearchParams)
export const loadOptions = createLoader(optionsSearchParams)
