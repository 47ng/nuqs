# Implementation Plan: Reproduction Case for Discussion 1293

## Overview

Add a reproduction case for query state leakage between routes in React Router v7 with nuqs, as demonstrated in the GitHub repository `itay-perry/react-router-nuqs-test`.

## Problem Description

The bug occurs when navigating between routes with different query parameters:

- Page A expects `count=1` but sometimes shows Page B's value (`count=2`)
- Page B expects `count=2` but sometimes shows Page A's value (`count=1`)
- This indicates improper query state isolation during navigation

## Implementation Strategy

### Files to Create

#### 1. Shared Components

**File**: `packages/e2e/shared/specs/repro-1293.tsx`

- Export `Repro1293PageA` component that expects `count=1`
- Export `Repro1293PageB` component that expects `count=2`
- Both components validate their query parameters and log discrepancies
- Include navigation links using the shared `useLink` hook
- Add console logging for debugging the state leakage

#### 2. Shared Test Specification

**File**: `packages/e2e/shared/specs/repro-1293.spec.ts`

- Export `testRepro1293PageA` and `testRepro1293PageB` test functions
- Use the established `defineTest` pattern
- Test navigation between pages with different query parameters
- Verify each page receives the correct query parameter
- Test rapid navigation to trigger the race condition
- Include assertions for console logs showing the bug

#### 3. React Router v6 Implementation

**Route Wrapper Files**:

- `packages/e2e/react-router/v6/src/routes/repro-1293.pageA.tsx`
- `packages/e2e/react-router/v6/src/routes/repro-1293.pageB.tsx`

**Test Specification**:

- `packages/e2e/react-router/v6/specs/shared/repro-1293.spec.ts`

**Router Configuration Update**:

- Update `packages/e2e/react-router/v6/src/react-router.tsx` to add the new routes

#### 4. React Router v7 Implementation

**Route Wrapper Files**:

- `packages/e2e/react-router/v7/app/routes/repro-1293.pageA.tsx`
- `packages/e2e/react-router/v7/app/routes/repro-1293.pageB.tsx`

**Test Specification**:

- `packages/e2e/react-router/v7/specs/shared/repro-1293.spec.ts`

**Routes Configuration Update**:

- Update `packages/e2e/react-router/v7/app/routes.ts` to add the new routes

## Implementation Details

### Shared Components (`repro-1293.tsx`)

```typescript
'use client'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'
import { useLink } from '../components/link'

export function Repro1293PageA() {
  const [count] = useQueryState('count', parseAsInteger.withDefault(0))
  const Link = useLink()

  const isCorrect = useMemo(() => {
    const correct = count === 1
    console.log('PageA render:', {
      count,
      expected: 1,
      isCorrect: correct ? '✅' : "❌ BUG - seeing Page B's value!"
    })
    return correct
  }, [count])

  // ... rest of component implementation
}

export function Repro1293PageB() {
  // Similar implementation for Page B expecting count=2
}
```

### Shared Test (`repro-1293.spec.ts`)

```typescript
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testRepro1293PageA = defineTest('repro-1293', ({ path }) => {
  it('should maintain query state isolation for Page A', async ({ page }) => {
    // Navigate to Page A
    await navigateTo(page, path)

    // Verify Page A shows count=1
    await expect(page.locator('h1')).toContainText('Page A ✅')
    await expect(page.locator('strong')).toHaveText('1')

    // Navigate to Page B
    await page.getByRole('link', { name: 'Go to Page B' }).click()
    await expect(page).toHaveURL('/repro-1293/pageB?count=2')

    // Verify Page B shows count=2
    await expect(page.locator('h1')).toContainText('Page B ✅')
    await expect(page.locator('strong')).toHaveText('2')

    // Navigate back to Page A (critical test)
    await page.getByRole('link', { name: 'Go to Page A' }).click()
    await expect(page).toHaveURL('/repro-1293/pageA?count=1')

    // Verify Page A still shows count=1 (this is where the bug manifests)
    await expect(page.locator('h1')).toContainText('Page A ✅')
    await expect(page.locator('strong')).toHaveText('1')
  })
})
```

### Route Wrapper Pattern

Following the established pattern, each route file will simply import and export the shared component:

```typescript
// repro-1293.pageA.tsx
import { Repro1293PageA } from 'e2e-shared/specs/repro-1293'
export default Repro1293PageA
```

### Router Configuration Updates

**React Router v6** (`react-router.tsx`):

```typescript
<Route path="repro-1293/pageA" lazy={load(import('./routes/repro-1293.pageA'))} />
<Route path="repro-1293/pageB" lazy={load(import('./routes/repro-1293.pageB'))} />
```

**React Router v7** (`app/routes.ts`):

```typescript
route('repro-1293/pageA', './routes/repro-1293.pageA.tsx'),
route('repro-1293/pageB', './routes/repro-1293.pageB.tsx'),
```

## Test Implementation Details

The test will perform these steps:

1. Navigate to `/repro-1293/pageA?count=1`
2. Verify Page A shows count=1 ✅
3. Navigate to `/repro-1293/pageB?count=2`
4. Verify Page B shows count=2 ✅
5. Navigate back to Page A
6. **Critical**: Verify Page A still shows count=1 (this is where the bug manifests ❌)
7. Repeat navigation rapidly to stress test state isolation

## Expected Outcomes

- **Before fix**: Test fails, showing query state leakage between routes
- **After fix**: Test passes, demonstrating proper query state isolation

## Console Logging Strategy

Both components will include detailed console logging:

- Log render events with expected vs actual values
- Log mounting/unmounting events
- Log when incorrect values are detected (bug manifestation)

This will help developers debug the issue and verify the fix.

## Consistency with Existing Patterns

- Uses `repro-1293` naming convention matching other reproduction cases
- Follows the shared component + route wrapper pattern
- Implements the same test structure as other repro cases
- Includes proper console logging for debugging
- Uses the established `defineTest` pattern

## Success Criteria

1. All files created following the established patterns
2. Tests run and demonstrate the bug (initial failure expected)
3. Console logs provide clear debugging information
4. Test coverage includes both React Router v6 and v7
5. Implementation matches the original GitHub repository's behavior

This reproduction case will provide a reliable way to test and verify the fix for the query state isolation bug described in discussion 1293, specifically for React Router adapters.
