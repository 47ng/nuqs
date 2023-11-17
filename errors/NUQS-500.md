# Empty Search Params Cache

This error shows up on the server when trying to access a searchParam from
a cache created with `createSearchParamsCache`, but when the cache was not
properly populated at the top of the page.

## A note on layouts

The error can also occur if your server component consuming the search params
cache is mounted in a **layout** component. Those don't receive search params as
they are not re-rendered when the page renders.

In this case, your only option is to turn the server component into a client
component, and read the search params with `useQueryStates`. You can
[feed it the same parser object](https://github.com/47ng/next-usequerystate#accessing-searchparams-in-server-components)
you used to create the cache, and it you'll get the same
type safety.

## Possible Solution

Run the `parseSearchParam` function on the page's `searchParams`:

```tsx
// page.tsx
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString
} from 'next-usequerystate/parsers'

const cache = createSearchParamsCache({
  q: parseAsString,
  maxResults: parseAsInteger.withDefault(10)
})

export default function Page({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // ⚠️ Don't forget to call `parse` here:
  const { q: query } = cache.parse(searchParams)
  return (
    <div>
      <h1>Search Results for {query}</h1>
      <Results />
    </div>
  )
}

function Results() {
  // In order to get search params from child server components:
  const maxResults = cache.get('maxResults')
  return <span>Showing up to {maxResults} results</span>
}
```
