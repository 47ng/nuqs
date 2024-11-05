import { parseAsString, useQueryStates } from 'nuqs'

export function SearchInput() {
  const [{ search }, setSearch] = useQueryStates({
    search: parseAsString.withDefault('')
  })
  return (
    <input
      role="search"
      type="search"
      value={search}
      onChange={e => setSearch({ search: e.target.value })}
    />
  )
}
