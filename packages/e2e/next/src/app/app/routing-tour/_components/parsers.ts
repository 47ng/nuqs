import { parseAsInteger, parseAsString } from 'nuqs/server'

export const counterParser = parseAsInteger.withDefault(0)
export const fromParser = parseAsString
