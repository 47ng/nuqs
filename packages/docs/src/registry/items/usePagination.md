```tsx
'use client'

import { usePagination } from '@/hooks/pagination'

export function ProductList() {
  const {
    page,          // Current page (1-indexed)
    pageSize,      // Items per page
    totalPages,    // Computed total pages
    hasNextPage,   // Can go forward
    hasPrevPage,   // Can go back
    nextPage,      // Go to next page
    prevPage,      // Go to previous page
    goToPage,      // Go to specific page
    setPageSize,   // Change page size
  } = usePagination({
    defaultPageSize: 10,
    totalItems: 1000,
  })

  return (
    <div>
      <div>
        {/* Your paginated content */}
        Page {page} of {totalPages}
      </div>

      <div>
        <button onClick={prevPage} disabled={!hasPrevPage}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>

      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
        <option value={10}>10 per page</option>
        <option value={25}>25 per page</option>
        <option value={50}>50 per page</option>
      </select>
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UsePaginationOptions {
  defaultPage?: number        // Default: 1
  defaultPageSize?: number    // Default: 10
  totalItems?: number         // For computing totalPages
  shallow?: boolean           // nuqs shallow option
  history?: 'push' | 'replace' // nuqs history option
  scroll?: boolean            // nuqs scroll option
}
```

### Return Value

```typescript
interface UsePaginationResult {
  page: number                          // Current page
  pageSize: number                      // Items per page
  totalPages: number | undefined        // Computed if totalItems provided
  hasNextPage: boolean                  // Can navigate forward
  hasPrevPage: boolean                  // Can navigate backward
  nextPage: () => void                  // Go to next page
  prevPage: () => void                  // Go to previous page
  goToPage: (page: number) => void      // Go to specific page
  setPageSize: (size: number) => void   // Change page size (resets to page 1)
  goToFirstPage: () => void             // Jump to first page
  goToLastPage: () => void              // Jump to last page (requires totalPages)
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
