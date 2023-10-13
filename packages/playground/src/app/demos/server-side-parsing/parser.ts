import { parseAsInteger } from 'next-usequerystate/parsers'

export const counterParser = parseAsInteger.withDefault(0)
