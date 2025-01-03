import { createParser, parseAsInteger, useQueryStates } from 'nuqs'

// The page index parser is zero-indexed internally,
// but one-indexed when rendered in the URL,
// to align with your UI and what users might expect.
const pageIndexParser = createParser({
  parse: query => {
    const page = parseAsInteger.parse(query)
    return page === null ? null : page - 1
  },
  serialize: value => {
    return parseAsInteger.serialize(value + 1)
  }
})

const paginationParsers = {
  pageIndex: pageIndexParser.withDefault(0),
  pageSize: parseAsInteger.withDefault(10)
}
const paginationUrlKeys = {
  pageIndex: 'page',
  pageSize: 'perPage'
}

export function usePaginationSearchParams(urlKeys = paginationUrlKeys) {
  return useQueryStates(paginationParsers, {
    urlKeys
  })
}
