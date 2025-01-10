import { debug } from '../../debug'

export function applyChange(
  newValue: URLSearchParams,
  keys: string[],
  copy: boolean
) {
  return (oldValue: URLSearchParams) => {
    const hasChanged =
      keys.length === 0
        ? true
        : keys.some(key => oldValue.get(key) !== newValue.get(key))
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
) {
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
