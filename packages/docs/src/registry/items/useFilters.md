```tsx
'use client'

import { useFilters } from '@/hooks/nuqs-presets/useFilters'
import { parseAsString, parseAsFloat, parseAsBoolean } from 'nuqs'

const filterParsers = {
  category: parseAsString,
  minPrice: parseAsFloat,
  maxPrice: parseAsFloat,
  inStock: parseAsBoolean,
}

export function FilterPanel() {
  const {
    filters,       // Current filters (type-safe)
    setFilter,     // Set single filter
    setFilters,    // Set multiple filters
    clearFilters,  // Clear all filters
    clearFilter,   // Clear single filter
    hasFilters,    // Any filters active?
  } = useFilters({
    parsers: filterParsers,
  })

  // filters.category is string | null
  // filters.minPrice is number | null
  // filters.inStock is boolean | null

  return (
    <div>
      <select 
        value={filters.category ?? ''} 
        onChange={(e) => setFilter('category', e.target.value || null)}
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>

      <input
        type="number"
        placeholder="Min price"
        value={filters.minPrice ?? ''}
        onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
      />

      <label>
        <input
          type="checkbox"
          checked={filters.inStock ?? false}
          onChange={(e) => setFilter('inStock', e.target.checked || null)}
        />
        In Stock Only
      </label>

      {hasFilters && (
        <button onClick={clearFilters}>
          Clear All Filters
        </button>
      )}
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseFiltersOptions<T extends Record<string, any>> {
  parsers: T                    // nuqs parser map
  shallow?: boolean
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Return Value

```typescript
interface UseFiltersResult<T> {
  filters: ParsedFilters<T>                       // Current filters (type-safe)
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  setFilters: (filters: Partial<ParsedFilters<T>>) => void
  clearFilter: (key: keyof T) => void
  clearFilters: () => void
  hasFilters: boolean                             // Any active filters?
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
