The `parseAsTuple` parser allows you to parse fixed-length tuples with **any type** for each position.

```ts
import { parseAsTuple } from '@/lib/parsers/parse-as-tuple'
import { parseAsString, parseAsStringLiteral } from 'nuqs'

// Sorting tuple [key: string, direction: 'asc' | 'desc']
parseAsTuple([parseAsString, parseAsStringLiteral(['asc', 'desc'])])

// Optionally, customise the separator
parseAsTuple([parseAsString, parseAsString], ';')
```
