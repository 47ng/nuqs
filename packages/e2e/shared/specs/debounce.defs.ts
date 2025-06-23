import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString,
  type inferParserType,
  type UrlKeys
} from 'nuqs/server'

export const demoControls = {
  debounceTime: parseAsInteger.withDefault(1000)
}

export const getUrl = createSerializer(demoControls, {
  clearOnDefault: false
})

export const demoSearchParams = {
  search: parseAsString.withDefault(''),
  pageIndex: parseAsInteger.withDefault(0)
}
export const demoSearchParamsUrlKeys: UrlKeys<typeof demoSearchParams> = {
  search: 'q',
  pageIndex: 'page'
}

export type DemoSearchParams = inferParserType<typeof demoSearchParams>

export const loadDemoSearchParams = createLoader(demoSearchParams, {
  urlKeys: demoSearchParamsUrlKeys
})
