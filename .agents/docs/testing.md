# Testing Patterns

Guide for testing strategy, test organization, and regression workflows.

## Full Test Suite

Run the complete test pipeline:

```bash
pnpm test
```

This takes **5-10 minutes** and includes:

- Build (tsup)
- Unit tests
- Type-level tests
- End-to-end tests

Do not time out the full suite.

## Test Categories

### Unit Tests

**Where:** `packages/nuqs/tests/*.test.ts`

Test hooks with `NuqsTestingAdapter`:

```ts
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { renderHook, act } from '@testing-library/react'
```

Coverage:

- Parser logic (valid, invalid, round-trip)
- Hook behavior (state updates, URL sync)
- Batching and throttling
- Builder methods (`.withDefault()`, `.withOptions()`)

### Type-Level Tests

**Where:** `packages/nuqs/tests/*.test-d.ts`

Add type tests when updating type definitions:

```ts
import { expectType, expectAssignable } from 'tsd'
```

Coverage:

- Hook return types
- Parser generic constraints
- Builder result types
- Exported type shape

### API Tests

**Where:** `packages/nuqs/src/api.test.ts`

Check exported symbols when adding new exports:

```ts
// Verify API surface matches documentation
import * as api from 'nuqs'
```

Coverage:

- All public exports present
- No unintended exports

### End-to-End Tests

**Where:** `packages/e2e/*`

Test framework-specific adapter behaviors:

Framework targets:

- Next.js app router
- Next.js pages router
- React SPA
- Remix
- TanStack Router
- React Router v6/v7

Coverage:

- Initial page load with search params
- URL updates and state synchronization
- History push/replace
- Adapter-specific features (shallow, SSR)
- Frame/tab sync (where applicable)

## Regression Workflow

When fixing a bug:

1. **Reproduce with failing test first** (preferred)
   - Add test case demonstrating the bug
   - Test should fail before fix
   - Test passes after fix

2. **Fix the issue**
   - Minimal change to fix the specific problem
   - Preserve all other behavior

3. **Ensure types remain stable**
   - Run type-level tests
   - Check `api.test.ts`
   - Validate with full `pnpm test`

4. **Add scenario to e2e if framework-specific**
   - If the bug is adapter-related, add e2e coverage
   - Helps prevent regressions in that framework

## Common Testing Patterns

### Testing a Parser

```ts
describe('parseAsCustomType', () => {
  it('parses valid input', () => {
    expect(parseAsCustomType.parse('valid')).toEqual(expectedValue)
  })

  it('returns null for invalid input', () => {
    expect(parseAsCustomType.parse('invalid')).toBeNull()
  })

  it('round-trips correctly', () => {
    const value = {
      /* ... */
    }
    expect(parseAsCustomType.parse(parseAsCustomType.serialize(value))).toEqual(
      value
    )
  })
})
```

### Testing Hook Behavior

```ts
it('updates state and URL together', () => {
  const { result } = renderHook(() => useQueryState('key', parseAsInteger), {
    wrapper: NuqsTestingAdapter
  })

  act(() => {
    result.current[1](42)
  })

  expect(result.current[0]).toBe(42)
  // Verify URL updated via NuqsTestingAdapter
})
```

## Test Organization Best Practices

- **One concept per test** — Single assertion focus
- **Clear naming** — Describe the scenario, not just "it works"
- **Isolate concerns** — Unit tests for logic, e2e for integration
- **Use fixtures** — Reusable test data and setup
- **Cleanup** — Unmount components, clear listeners
- **Type safety** — Use TypeScript for test code too

## Debugging Tests

Enable debug logs:

```ts
// In test file
beforeEach(() => {
  localStorage.setItem('debug', 'nuqs')
})

afterEach(() => {
  localStorage.removeItem('debug')
})
```

Debug output:

- `[nuqs]` — Single-key operations
- `[nuq+]` — Multi-key operations

## CI/CD Integration

- Tests run automatically on pull requests
- Full suite must pass before merge
- Type checking is part of test suite
- No manual intervention needed for test validation
