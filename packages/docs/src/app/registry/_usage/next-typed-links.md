This utility connects your `typedRoutes` type-safe pathnames
to a search params descriptor object, and gives you back a function
you can call to generate a fully type-safe (pathname + search params) href
for linking & routing:

```ts title="src/app/map/search-params.ts"
import { createTypedLink } from '@/src/lib/typed-links'
import { parseAsFloat, type UrlKeys } from 'nuqs/server'

const coordinates = {
  latitude: parseAsFloat.withDefault(0),
  longitude: parseAsFloat.withDefault(0)
}
// Optional remapping for shorter keys
const urlKeys: UrlKeys<typeof coordinates> = {
  latitude: 'lat',
  longitude: 'lng'
}

// [!code word:createTypedLink]
export const getMapLink = createTypedLink(
  '/map', // The values here are inferred from your app's routes
  coordinates,
  { urlKeys }
)

// Usage:
getMapLink({ latitude: 12.34, longitude: 56.78 })
// "/map?lat=12.34&lng=56.78"
```
