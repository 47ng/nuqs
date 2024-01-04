import { parseAsInteger, parseAsString } from 'nuqs/parsers'

export const delayParser = parseAsInteger.withDefault(0)
export const queryParser = parseAsString.withDefault('')
