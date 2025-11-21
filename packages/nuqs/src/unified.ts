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
    const mergedOptions = mergeOptions(
      options,
      $unified in newParsers
        ? mergeOptions(newParsers.options, newOptions)
        : newOptions
    )
    return defineSearchParams<Parsers & NewParsers, NewPartialOutput>(
      {
        ...parsers,
        ...($unified in newParsers ? newParsers.parsers : newParsers)
      },
      {
        ...mergedOptions,
        partialOutput: mergeOption(
          options.partialOutput as unknown as NewPartialOutput,
          newOptions.partialOutput as NewPartialOutput,
          true as NewPartialOutput
        )
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

// todo: Refactor options merge with the throttle queue
type MergeableOptions<P extends ParserMap> = Omit<
  UnifiedOptions<P>,
  'partialOutput'
>

export function mergeOptions<A extends ParserMap, B extends ParserMap>(
  a: MergeableOptions<A>,
  b: MergeableOptions<B>
): MergeableOptions<A & B> {
  return {
    clearOnDefault: mergeOption(a.clearOnDefault, b.clearOnDefault, false),
    history: mergeOption(a.history, b.history, 'push'),
    shallow: mergeOption(a.shallow, b.shallow, false),
    scroll: mergeOption(a.scroll, b.scroll, true),
    limitUrlUpdates: mergeLimitUrlUpdates(a.limitUrlUpdates, b.limitUrlUpdates),
    urlKeys: {
      ...(a.urlKeys || {}),
      ...(b.urlKeys || {})
    } as UrlKeys<A & B>
  }
}

function mergeOption<Type>(
  a: Type | undefined,
  b: Type | undefined,
  wins: Type
): Type | undefined {
  if (a === undefined && b === undefined) return undefined
  if (a === wins) return a
  if (b === wins) return b
  return b ?? a
}

function mergeLimitUrlUpdates(
  a: Options['limitUrlUpdates'],
  b: Options['limitUrlUpdates']
): Options['limitUrlUpdates'] {
  if (a === undefined) return b
  if (b === undefined) return a
  if (a.method === b.method) {
    return a.timeMs >= b.timeMs ? a : b
  }
  return b.method === 'debounce' ? b : a
}
