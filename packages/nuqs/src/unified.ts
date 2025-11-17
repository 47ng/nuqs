import type { Options, UrlKeys } from './defs'
import {
  createLoader,
  type CreateLoaderOptions,
  type LoaderFunction
} from './loader'
import type { ParserMap } from './parsers'
import { createSerializer, type CreateSerializerOptions } from './serializer'
import {
  createStandardSchemaV1,
  type CreateStandardSchemaV1Options
} from './standard-schema'

export const $unified: unique symbol = Symbol.for('nuqs/unified')

export type UnifiedOptions<
  Parsers extends ParserMap,
  PartialOutput extends boolean = false
> = Partial<
  Pick<
    Options,
    'shallow' | 'history' | 'scroll' | 'limitUrlUpdates' | 'clearOnDefault'
  >
> &
  CreateSerializerOptions<Parsers> &
  CreateLoaderOptions<Parsers> &
  Omit<
    CreateStandardSchemaV1Options<Parsers, PartialOutput>,
    'load' | 'serialize'
  > & {}

// todo: Find a better name for this type
export type UnifiedAPI<
  Parsers extends ParserMap,
  PartialOutput extends boolean = false
> = ReturnType<typeof createStandardSchemaV1<Parsers, PartialOutput>> & {
  [$unified]: true
  parsers: Parsers
  options: UnifiedOptions<Parsers, PartialOutput>
  load: LoaderFunction<Parsers>
  serialize: ReturnType<typeof createSerializer<Parsers>>
  extend: <
    NewParsers extends ParserMap,
    NewPartialOutput extends boolean = PartialOutput
  >(
    newParsers: NewParsers | UnifiedAPI<NewParsers, NewPartialOutput>,
    newOptions?: UnifiedOptions<NewParsers, NewPartialOutput>
  ) => UnifiedAPI<Parsers & NewParsers, NewPartialOutput>
  pick: <Keys extends Partial<Record<keyof Parsers, true>>>(
    keys: Keys
  ) => UnifiedAPI<
    {
      [K in keyof Keys & keyof Parsers]: Parsers[K]
    },
    PartialOutput
  >
}

export function defineSearchParams<
  Parsers extends ParserMap,
  PartialOutput extends boolean = false
>(
  parsers: Parsers,
  options: UnifiedOptions<Parsers, PartialOutput> = {}
): UnifiedAPI<Parsers, PartialOutput> {
  const load = createLoader(parsers, options)
  const serialize = createSerializer(parsers, options)
  const schema = createStandardSchemaV1<Parsers, PartialOutput>(parsers, {
    serialize,
    load,
    partialOutput: options.partialOutput,
    urlKeys: options.urlKeys
  })
  function extend<
    NewParsers extends ParserMap,
    NewPartialOutput extends boolean = PartialOutput
  >(
    newParsers: NewParsers | UnifiedAPI<NewParsers, NewPartialOutput>,
    newOptions: UnifiedOptions<NewParsers, NewPartialOutput> = {}
  ) {
    return defineSearchParams<Parsers & NewParsers, NewPartialOutput>(
      {
        ...parsers,
        ...($unified in newParsers ? newParsers.parsers : newParsers)
      },
      {
        // todo: Refactor options merge with the throttle queue
        clearOnDefault: mergeOptions(
          options.clearOnDefault,
          newOptions.clearOnDefault,
          false
        ),
        history: mergeOptions(options.history, newOptions.history, 'push'),
        shallow: mergeOptions(options.shallow, newOptions.shallow, false),
        scroll: mergeOptions(options.scroll, newOptions.scroll, true),
        // todo: limitUrlUpdates merge strategy?
        partialOutput: mergeOptions(
          options.partialOutput as unknown as NewPartialOutput,
          newOptions.partialOutput as NewPartialOutput,
          true as NewPartialOutput
        ),
        urlKeys: {
          ...(options.urlKeys || {}),
          ...(newOptions.urlKeys || {})
        } as UrlKeys<Parsers & NewParsers>
      }
    )
  }
  function pick<Keys extends Partial<Record<keyof Parsers, true>>>(keys: Keys) {
    const pickedParsers = Object.fromEntries(
      Object.keys(keys).map(key => [key, parsers[key as keyof Parsers]])
    ) as {
      [K in keyof Keys & keyof Parsers]: Parsers[K]
    }
    return defineSearchParams(pickedParsers, options)
  }
  return {
    [$unified]: true,
    ...schema,
    load,
    serialize,
    parsers,
    options,
    extend,
    pick
  }
}

function mergeOptions<Type>(
  a: Type | undefined,
  b: Type | undefined,
  wins: Type
): Type | undefined {
  if (a === undefined && b === undefined) return undefined
  if (a === wins) return a
  if (b === wins) return b
  return b ?? a
}
