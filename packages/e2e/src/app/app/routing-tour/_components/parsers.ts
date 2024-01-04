import { parseAsInteger, parseAsString } from 'nuqs/parsers'

export const counterParser = parseAsInteger.withDefault(0)
export const fromParser = parseAsString
