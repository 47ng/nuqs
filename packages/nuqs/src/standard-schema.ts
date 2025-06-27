import type { StandardSchemaV1 } from '@standard-schema/spec'
import { createLoader, type CreateLoaderOptions } from './loader'
import type { ParserMap, inferParserType } from './parsers'
import { createSerializer } from './serializer'

export type CreateStandardSchemaV1Options<
  Parsers extends ParserMap,
  PartialOutput extends boolean = false
> = CreateLoaderOptions<Parsers> & {
  /**
   * Marks the output type as Partial, and removes any keys
   * from the output that are not present in the input.
   *
   * This is useful for TanStack Router, to avoid reflecting default values
   * (or null) in the URL, and to make search params optional in Links,
   * as default values are handled by nuqs.
   *
   * @default false
   */
  partialOutput?: PartialOutput
}

type MaybePartial<Condition, Type> = Condition extends true
  ? Partial<Type>
  : Type

export function createStandardSchemaV1<
  Parsers extends ParserMap,
  PartialOutput extends boolean = false
>(
  parsers: Parsers,
  {
    urlKeys,
    partialOutput = false as PartialOutput
  }: CreateStandardSchemaV1Options<Parsers, PartialOutput> = {}
): StandardSchemaV1<MaybePartial<PartialOutput, inferParserType<Parsers>>> {
  const serialize = createSerializer(parsers, { urlKeys })
  const load = createLoader(parsers, { urlKeys })
  return {
    '~standard': {
      version: 1,
      vendor: 'nuqs',
      validate(input) {
        try {
          const url = serialize(input as any)
          const value = load(url, { strict: true })
          if (partialOutput) {
            for (const key in value) {
              if (!(key in (input as any))) {
                delete value[key]
              }
            }
          }
          return { value }
        } catch (error) {
          return {
            issues: [
              {
                message: error instanceof Error ? error.message : String(error)
              }
            ]
          }
        }
      }
    }
  }
}
