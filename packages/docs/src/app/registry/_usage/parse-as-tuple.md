The `parseAsTuple` parser allows you to parse fixed-length tuples with **any type** for each position.

```ts
import { parseAsTuple } from '@/lib/parsers/parse-as-tuple'
import { parseAsInteger } from 'nuqs'

// Coordinates tuple (x, y)
parseAsTuple([parseAsInteger, parseAsInteger])

// Optionally, customise the separator
parseAsTuple([parseAsInteger, parseAsInteger], ';')
```
