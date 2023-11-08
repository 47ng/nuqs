import { parseAsInteger, parseAsString } from 'next-usequerystate/parsers'

export const counterParser = parseAsInteger.withDefault(0)
export const fromParser = parseAsString
