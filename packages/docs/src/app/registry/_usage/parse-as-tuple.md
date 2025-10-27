The `parseAsTuple` parser allows you to parse fixed-length tuples with **any type** for each position.

```ts
import { parseAsInteger } from 'nuqs'
import { parseAsTuple } from '~/components/parsers/parseAsTuple'

// Coordinates tuple (x, y)
parseAsTuple([parseAsInteger, parseAsInteger])

// Optionally, customise the separator
parseAsTuple([parseAsInteger, parseAsInteger], ';')
```
