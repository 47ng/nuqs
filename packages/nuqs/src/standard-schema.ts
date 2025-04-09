import type { StandardSchemaV1 } from '@standard-schema/spec'
import { createLoader, type CreateLoaderOptions } from './loader'
import type { ParserMap, inferParserType } from './parsers'
import { createSerializer } from './serializer'

export function createStandardSchemaV1<Parsers extends ParserMap>(
  parsers: Parsers,
  { urlKeys }: CreateLoaderOptions<Parsers> = {}
): StandardSchemaV1<inferParserType<Parsers>, inferParserType<Parsers>> {
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
