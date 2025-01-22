import { ColumnFilter } from '@tanstack/react-table'
import { createParser, parseAsArrayOf, useQueryState } from 'nuqs'

// Each column filter is represented as `columnId=value`,
// for example: `?filter=email=john.doe@example.com&age=["7",null]`
const filterParser = createParser({
  parse: query => {
    const [id, value] = query.split('=')
    return {
      id,
      value: JSON.parse(value ?? '')
    } as ColumnFilter
  },
  serialize: value => `${value.id}=${JSON.stringify(value.value)}`,
  // This is a simple equality check for comparing objects.
  // It works by converting both objects to strings and comparing them.
  // For more robust deep equality, consider using lodash's isEqual.
  eq: (a, b) => JSON.stringify(a) === JSON.stringify(b)
})

const parseAsColumnFiltersState = parseAsArrayOf(filterParser).withDefault([])

export function useColumnFiltersSearchParams(key = 'filter') {
  return useQueryState(key, parseAsColumnFiltersState)
}
