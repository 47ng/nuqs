export function isAbsentFromUrl(
  query: string | Iterable<string> | null
): query is null | [] {
  return query === null || (Array.isArray(query) && query.length === 0)
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
