import type { Options } from '../defs'
import type { Parser } from '../parsers'

export function read<T>(
  parser: Parser<T> &
    Options & {
      defaultValue?: T
    },
  key: string,
  searchParams: URLSearchParams,
  strict: boolean
): T | null {
  let result
  const query =
    parser.type === 'multi'
      ? searchParams.getAll(key) // empty key to get all values
      : searchParams.get(key)
  if (query === null || (Array.isArray(query) && query.length === 0)) {
    return parser.defaultValue ?? null
  }
  try {
    // we have properly narrowed `query` here, but TS doesn't keep track of that
    // there are probably better ways to do this than a type assertion ¯\_(ツ)_/¯
    result = parser.parse(query as string & readonly string[])
  } catch (error) {
    if (strict) {
      throw new Error(
        `[nuqs] Error while parsing query \`${query}\` for key \`${key}\`: ${error}`
      )
    }
    result = null
  }
  if (strict && query && result === null) {
    throw new Error(
      `[nuqs] Failed to parse query \`${query}\` for key \`${key}\` (got null)`
    )
  }
  return result
}

export function write(
  serialized: Iterable<string>,
  key: string,
  searchParams: URLSearchParams
): URLSearchParams {
  if (typeof serialized === 'string') {
    searchParams.set(key, serialized)
  } else {
    searchParams.delete(key)
    for (const v of serialized) {
      searchParams.append(key, v)
    }
  }
  return searchParams
}
