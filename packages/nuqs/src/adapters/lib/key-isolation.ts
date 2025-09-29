import { debug } from '../../lib/debug'
import { compareQuery } from '../../lib/compare'

export function applyChange(
  newValue: URLSearchParams,
  keys: string[],
  copy: boolean
): (oldValue: URLSearchParams) => URLSearchParams {
  return (oldValue: URLSearchParams) => {
    const hasChanged =
      keys.length === 0
        ? true
        : keys.some(
            key => !compareQuery(oldValue.getAll(key), newValue.getAll(key))
          )
    if (!hasChanged) {
      debug(
        '[nuqs `%s`] no change, returning previous',
        keys.join(','),
        oldValue
      )
      return oldValue
    }
    const filtered = filterSearchParams(newValue, keys, copy)
    debug(
      `[nuqs \`%s\`] subbed search params change
  from %O
  to   %O`,
      keys.join(','),
      oldValue,
      filtered
    )
    return filtered
  }
}

export function filterSearchParams(
  search: URLSearchParams,
  keys: string[],
  copy: boolean
): URLSearchParams {
  if (keys.length === 0) {
    return search
  }
  const filtered = copy ? new URLSearchParams(search) : search
  for (const key of search.keys()) {
    if (!keys.includes(key)) {
      filtered.delete(key)
    }
  }
  return filtered
}
