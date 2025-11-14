```tsx
'use client'

import { useTabs } from '@/hooks/tabs'

export function TabsExample() {
  const {
    activeTab,     // Current tab (type-safe)
    setTab,        // Change tab
    isActive,      // Check if tab is active
  } = useTabs(['overview', 'analytics', 'settings'] as const)

  // activeTab is typed as 'overview' | 'analytics' | 'settings'

  return (
    <div>
      <div>
        <button 
          onClick={() => setTab('overview')}
          className={isActive('overview') ? 'active' : ''}
        >
          Overview
        </button>
        <button 
          onClick={() => setTab('analytics')}
          className={isActive('analytics') ? 'active' : ''}
        >
          Analytics
        </button>
        <button 
          onClick={() => setTab('settings')}
          className={isActive('settings') ? 'active' : ''}
        >
          Settings
        </button>
      </div>

      <div>
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}
```

## API Reference

### Options

```typescript
interface UseTabsOptions<T extends readonly string[]> {
  tabs: T                           // Available tabs
  defaultTab?: T[number]            // Initial tab
  shallow?: boolean
  history?: 'push' | 'replace'
  scroll?: boolean
}
```

### Return Value

```typescript
interface UseTabsResult<T> {
  activeTab: T                      // Current tab (type-safe)
  setTab: (tab: T) => void         // Change tab
  isActive: (tab: T) => boolean    // Check if tab is active
}
```

## More Information

- **GitHub**: [nuqs-presets](https://github.com/iHiteshAgrawal/nuqs-presets)
- **npm**: [nuqs-presets](https://www.npmjs.com/package/nuqs-presets)
- **Examples**: See the [examples directory](https://github.com/iHiteshAgrawal/nuqs-presets/tree/main/examples)
