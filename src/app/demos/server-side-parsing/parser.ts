import { parseAsInteger } from '../../../../dist/parsers'

export const counterParser = parseAsInteger
  .withOptions({ shallow: false })
  .withDefault(0)
