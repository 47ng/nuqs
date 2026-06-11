export type Query = string | Array<string>

export const isAbsentFromUrl = (q: Query | null): q is null | [] =>
  q === null || (Array.isArray(q) && !q.length)

export function write(
  searchParams: URLSearchParams,
  key: string,
  serialized: Query
): URLSearchParams {
  if (typeof serialized === 'string') {
    searchParams.set(key, serialized)
  } else {
    searchParams.delete(key)
    for (const v of serialized) searchParams.append(key, v)
    // if we get here with an empty iterable, no values were appended
    // however, an empty iterable here means we explicitly want to set the key
    // because for default values, we don't call write at all
    if (!searchParams.has(key)) searchParams.set(key, '')
  }
  return searchParams
}

export function getSearchParams(url: string | URL): URLSearchParams {
  if (url instanceof URL) return url.searchParams
  try {
    return url.startsWith('?')
      ? new URLSearchParams(url)
      : new URL(url, location.origin).searchParams
  } catch {
    return new URLSearchParams(url)
  }
}
