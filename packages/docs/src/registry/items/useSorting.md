```tsx
'use client'

import { useSorting } from '@/hooks/sorting'

export function DataTable() {
  const {
    sortBy,        // Current sort column
    sortOrder,     // 'asc' | 'desc' | null
    toggleSort,    // Toggle column sort
    isSortedBy,    // Check if column is sorted
    clearSort,     // Clear all sorting
  } = useSorting({
    columns: ['name', 'date', 'price'] as const,
    defaultColumn: 'name',
    defaultOrder: 'asc',
  })

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => toggleSort('name')}>
            Name {isSortedBy('name') && (sortOrder === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => toggleSort('price')}>
            Price {isSortedBy('price') && (sortOrder === 'asc' ? '↑' : '↓')}
          </th>
          <th onClick={() => toggleSort('date')}>
            Date {isSortedBy('date') && (sortOrder === 'asc' ? '↑' : '↓')}
          </th>
        </tr>
      </thead>
      {/* Table body with sorted data */}
    </table>
  )
}
```

## API Reference

### Options

```typescript
interface UseSortingOptions<T extends readonly string[]> {
  columns: T                        // Available columns
  defaultColumn?: T[number]         // Initial sort column
  defaultOrder?: 'asc' | 'desc'    // Initial order
  shallow?: boolean
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Return Value

```typescript
interface UseSortingResult<T> {
  sortBy: T | null                      // Current column
  sortOrder: 'asc' | 'desc' | null     // Current order
  toggleSort: (column: T) => void      // Toggle column (null→asc→desc→null)
  setSorting: (column: T | null, order: 'asc' | 'desc' | null) => void
  isSortedBy: (column: T) => boolean   // Check if column is active
  clearSort: () => void                // Clear sorting
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
