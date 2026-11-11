```tsx
'use client'

import { useDateRange } from '@/hooks/nuqs-presets/useDateRange'

export function DateRangePicker() {
  const {
    startDate,     // Start date
    endDate,       // End date
    setRange,      // Set both dates
    setStartDate,  // Set start only
    setEndDate,    // Set end only
    clearRange,    // Clear both
    presets,       // Quick preset functions
    daysInRange,   // Number of days
    isValid,       // Valid range (start <= end)
  } = useDateRange({
    defaultPreset: 'last7days',
  })

  return (
    <div>
      <div>
        <button onClick={() => presets.last7days()}>Last 7 Days</button>
        <button onClick={() => presets.last30days()}>Last 30 Days</button>
        <button onClick={() => presets.thisMonth()}>This Month</button>
        <button onClick={() => presets.lastMonth()}>Last Month</button>
      </div>

      <div>
        <input
          type="date"
          value={startDate ?? ''}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span>to</span>
        <input
          type="date"
          value={endDate ?? ''}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {isValid && (
        <p>{daysInRange} days selected</p>
      )}

      <button onClick={clearRange}>Clear</button>
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseDateRangeOptions {
  defaultStartDate?: string           // ISO date string
  defaultEndDate?: string             // ISO date string
  defaultPreset?: PresetKey           // Apply preset on mount
  shallow?: boolean
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Presets

Available preset functions:
- `presets.today()` - Today only
- `presets.yesterday()` - Yesterday only
- `presets.last7days()` - Last 7 days
- `presets.last30days()` - Last 30 days
- `presets.thisMonth()` - Current month
- `presets.lastMonth()` - Previous month

### Return Value

```typescript
interface UseDateRangeResult {
  startDate: string | null
  endDate: string | null
  setStartDate: (date: string | null) => void
  setEndDate: (date: string | null) => void
  setRange: (start: string | null, end: string | null) => void
  clearRange: () => void
  presets: DateRangePresets
  daysInRange: number | null          // Days between dates
  isValid: boolean                     // startDate <= endDate
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
