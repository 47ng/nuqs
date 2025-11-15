import { createLoader, type LoaderFunction } from './loader'
import type { ParserMap } from './parsers'
import { createSerializer } from './serializer'
import { useQueryStates, type UseQueryStatesReturn } from './useQueryStates'

type UnifiedAPI<Parsers extends ParserMap> = {
  useQueryStates: () => UseQueryStatesReturn<Parsers>
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
  const hook = () => useQueryStates(parsers)
  const load = createLoader(parsers)
  const serialize = createSerializer(parsers)
  function extend<NewParsers extends ParserMap>(
    newParsers: NewParsers | UnifiedAPI<NewParsers>
  ) {
    return defineSearchParams<Parsers & NewParsers>({
      ...parsers,
      ...('parsers' in newParsers
        ? (newParsers as unknown as UnifiedAPI<NewParsers>).parsers
        : (newParsers as NewParsers))
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
    useQueryStates: hook,
    load,
    serialize,
    parsers,
    extend,
    pick
  }
}
