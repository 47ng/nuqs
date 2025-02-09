import {
  createLoader,
  parseAsInteger,
  parseAsString,
  UrlKeys
} from 'nuqs/server'

export const searchParams = {
  search: parseAsString.withDefault('').withOptions({
    limitUrlUpdates: { method: 'debounce', timeMs: 2000 }
  }),
  pageIndex: parseAsInteger.withDefault(0)
}
export const urlKeys: UrlKeys<typeof searchParams> = {
  search: 'q',
  pageIndex: 'page'
}

export const loadSearchParams = createLoader(searchParams, { urlKeys })
