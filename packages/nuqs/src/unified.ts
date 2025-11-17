import type { StandardSchemaV1 } from '@standard-schema/spec'
import { createLoader, type LoaderFunction } from './loader'
import type { inferParserType, ParserMap } from './parsers'
import { createSerializer } from './serializer'
import { createStandardSchemaV1 } from './standard-schema'

export const $unified: unique symbol = Symbol.for('nuqs/unified')

// todo: Find a better name for this type
export type UnifiedAPI<Parsers extends ParserMap> = StandardSchemaV1<
  inferParserType<Parsers>
> & {
  [$unified]: true
  load: LoaderFunction<Parsers>
  serialize: ReturnType<typeof createSerializer<Parsers>>
  parsers: Parsers
  extend: <NewParsers extends ParserMap>(
    newParsers: NewParsers | UnifiedAPI<NewParsers>
  ) => UnifiedAPI<Parsers & NewParsers>
  pick: <Keys extends Partial<Record<keyof Parsers, true>>>(
    keys: Keys
  ) => UnifiedAPI<{
    [K in keyof Keys & keyof Parsers]: Parsers[K]
  }>
}

export function defineSearchParams<Parsers extends ParserMap>(
  parsers: Parsers
): UnifiedAPI<Parsers> {
  const load = createLoader(parsers)
  const serialize = createSerializer(parsers)
  const schema = createStandardSchemaV1(parsers)
  function extend<NewParsers extends ParserMap>(
    newParsers: NewParsers | UnifiedAPI<NewParsers>
  ) {
    return defineSearchParams<Parsers & NewParsers>({
      ...parsers,
      ...($unified in newParsers ? newParsers.parsers : newParsers)
    })
  }
  function pick<Keys extends Partial<Record<keyof Parsers, true>>>(keys: Keys) {
    const pickedParsers = Object.fromEntries(
      Object.keys(keys).map(key => [key, parsers[key as keyof Parsers]])
    ) as {
      [K in keyof Keys & keyof Parsers]: Parsers[K]
    }
    return defineSearchParams(pickedParsers)
  }
  return {
    [$unified]: true,
    ...schema,
    load,
    serialize,
    parsers,
    extend,
    pick
  }
}
