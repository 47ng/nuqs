import { parseAsInteger } from 'nuqs/server'

export const counterParser = parseAsInteger.withDefault(0)
