import {
  createLoader,
  type inferParserType,
  parseAsInteger,
  parseAsString
} from 'nuqs/server'

const searchParams = {
  test: parseAsString,
  int: parseAsInteger
}

export type SearchParams = inferParserType<typeof searchParams>
export const loadSearchParams = createLoader(searchParams)

type LoaderRendererProps = {
  serverValues: inferParserType<typeof searchParams>
}

export function LoaderRenderer({ serverValues }: LoaderRendererProps) {
  return (
    <>
      <pre id="test">{serverValues.test}</pre>
      <pre id="int">{serverValues.int}</pre>
    </>
  )
}
