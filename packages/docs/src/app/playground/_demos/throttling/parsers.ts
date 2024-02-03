import { parseAsInteger, parseAsString } from 'nuqs/server'

export const delayParser = parseAsInteger.withDefault(0)
export const queryParser = parseAsString.withDefault('')
