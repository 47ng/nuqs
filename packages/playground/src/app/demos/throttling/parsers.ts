import { parseAsInteger, parseAsString } from 'next-usequerystate/parsers'

export const delayParser = parseAsInteger.withDefault(0)
export const queryParser = parseAsString.withDefault('')
