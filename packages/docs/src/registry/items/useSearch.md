```tsx
'use client'

import { useSearch } from '@/hooks/nuqs-presets/useSearch'

export function SearchBar() {
  const {
    query,           // Current search query
    debouncedQuery,  // Debounced value for API calls
    setQuery,        // Update search
    isDebouncing,    // Debounce in progress
    clearQuery,      // Clear search
  } = useSearch({
    debounce: 300,   // ms to wait
    minLength: 2,    // minimum chars
    trim: true,      // auto-trim whitespace
  })

  // Use debouncedQuery for API calls
  const { data } = useQuery({
    queryKey: ['products', debouncedQuery],
    queryFn: () => fetchProducts(debouncedQuery),
  })

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {isDebouncing && <span>Searching...</span>}
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseSearchOptions {
  defaultQuery?: string       // Default: ''
  debounce?: number          // Default: 300ms
  minLength?: number         // Default: 0 (no minimum)
  trim?: boolean             // Default: true
  shallow?: boolean          // nuqs shallow option
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Return Value

```typescript
interface UseSearchResult {
  query: string                     // Current query (immediate)
  debouncedQuery: string           // Debounced query (for API calls)
  setQuery: (query: string) => void // Update query
  clearQuery: () => void           // Clear search
  isDebouncing: boolean            // Debounce in progress
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
