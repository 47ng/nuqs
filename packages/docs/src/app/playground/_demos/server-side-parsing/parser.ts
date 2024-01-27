import { parseAsInteger } from 'nuqs/parsers'

export const counterParser = parseAsInteger.withDefault(0)
