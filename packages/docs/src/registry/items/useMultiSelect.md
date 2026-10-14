```tsx
'use client'

import { useMultiSelect } from '@/hooks/nuqs-presets/useMultiSelect'

const ITEMS = ['item1', 'item2', 'item3', 'item4']

export function MultiSelectList() {
  const {
    selected,      // Selected item IDs
    toggle,        // Toggle single item
    selectAll,     // Select all items
    deselectAll,   // Deselect all
    isSelected,    // Check if item selected
    selectCount,   // Number selected
  } = useMultiSelect({
    allItems: ITEMS,
  })

  return (
    <div>
      <div>
        <button onClick={selectAll}>Select All</button>
        <button onClick={deselectAll}>Deselect All</button>
        <span>{selectCount} selected</span>
      </div>

      <ul>
        {ITEMS.map(item => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={isSelected(item)}
                onChange={() => toggle(item)}
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseMultiSelectOptions<T> {
  allItems?: readonly T[]       // All available items
  defaultSelected?: T[]         // Initially selected
  shallow?: boolean
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Return Value

```typescript
interface UseMultiSelectResult<T> {
  selected: T[]                         // Selected items
  toggle: (item: T) => void            // Toggle selection
  select: (item: T) => void            // Add to selection
  deselect: (item: T) => void          // Remove from selection
  selectAll: () => void                // Select all items
  deselectAll: () => void              // Clear selection
  isSelected: (item: T) => boolean     // Check if selected
  selectCount: number                  // Number of selected items
  isAllSelected: boolean               // All items selected
  isNoneSelected: boolean              // No items selected
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
