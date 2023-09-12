import { parseAsInteger, parseAsString } from '../../../../../../dist/parsers'

export const counterParser = parseAsInteger.withDefault(0)
export const fromParser = parseAsString
