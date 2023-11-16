# Empty Search Params Cache

This error shows up on the server when trying to access a searchParam from
a cache created with `createSearchParamCache`, but when the cache was not
properly populated at the top of the page.

## Solution

Run the `parseSearchParam` function on the page's `searchParams`:

```tsx
// page.tsx
import {
  createSearchParamCache,
  parseAsInteger,
  parseAsString
} from 'next-usequerystate/parsers'

const { parseSearchParams, getSearchParam } = createSearchParamCache({
  q: parseAsString,
  maxResults: parseAsInteger.withDefault(10)
})

export default function Page({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // ⚠️ Don't forget to call `parseSearchParams` here:
  const { q: query } = parseSearchParams(searchParams)
  return (
    <div>
      <h1>Search Results for {query}</h1>
      <Results />
    </div>
  )
}

function Results() {
  // In order to get search params from child server components:
  const maxResults = getSearchParam('maxResults')
  return <span>Showing up to {maxResults} results</span>
}
```
