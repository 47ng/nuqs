export type QueryParam = string | Array<string>

export function isAbsentFromUrl(query: QueryParam | null): query is null | [] {
  return query === null || (Array.isArray(query) && query.length === 0)
}

export function write(
  serialized: QueryParam,
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
    // if we get here with an empty iterable, no values were appended
    // however, an empty iterable here means we explicitly want to set the key
    // because for default values, we don't call write at all
    if (!searchParams.has(key)) {
      searchParams.set(key, '')
    }
  }
  return searchParams
}
