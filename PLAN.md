# Fix: Extra render when updating search params in useEffect (#1365)

## 1. Problem Statement

When a `useEffect` updates one query param in response to another changing, the effect fires multiple times instead of once. In the reproduction (`nuqs-repro-1365`), toggling `a` causes the `useEffect` watching `[a]` to fire 3 times instead of 1, with the value oscillating `true → false → true`.

**Reproduction confirmed in:** Next.js dev mode (with and without StrictMode).
**Not reproducible in:** Next.js production builds (`next start`).

## 2. Root Cause Analysis

### 2.1 The Premature Queue Clearing (Gap 1)

In `ThrottledQueue.applyPendingUpdates()` (`throttle.ts:193-194`), when `autoResetQueueOnUpdate: true` (Next.js App Router), the queue's `updateMap` is cleared via `this.reset()` **before** `updateUrl()` updates the browser URL:

```
Line 188:  const items = Array.from(this.updateMap.entries())  ← copy items
Line 193:  if (adapter.autoResetQueueOnUpdate) {
Line 194:    this.reset()                                       ← CLEAR QUEUE
Line 195:  }
Line 209:    updateUrl(search, options)                          ← UPDATE URL (later)
```

Between these two points, `getQueuedQuery(key)` returns `undefined`. The `parseMap` function falls back to `searchParams` (from `useSearchParams()`), which hasn't caught up yet → returns the **default** value.

### 2.2 The Priority Inversion (Gap 2)

Two React update mechanisms compete at different priorities:

- **`useSyncExternalStore`** (nuqs queued values) → fires at **SyncLane** (highest priority, non-batchable)
- **`useSearchParams`** (Next.js router state) → updates via **startTransition** (lower priority, deferred)

Per React issues [#25191](https://github.com/facebook/react/issues/25191) and [#24831](https://github.com/facebook/react/issues/24831), `useSyncExternalStore` updates **cannot batch** with transition updates. When the queue clears, the SyncLane re-render commits the "no queued value + stale searchParams" state before the transition resolves.

### 2.3 Why Dev-Only

In dev mode, React StrictMode's double-render and double-effect-fire widen the timing window between queue clear and URL catch-up. In production, the single render pass is fast enough that the gap is imperceptible — but it still exists structurally.

### 2.4 The Three Representations Problem

nuqs maintains three parallel representations of the same state:

```
                    VALUE AVAILABLE FROM:
                    Queue    URL     Emitter State
                    ─────    ───     ─────────────
Before setState:     -        -          -
After emit:          -        -          ✓ (correct)
After queue push:    ✓        -          ✓
During flush:        ✓        -          ✓
After reset():       ✗        -          ✓ (but may be overwritten by parseMap)
After updateUrl:     ✗        ✓ (async)  ✓
URL transition done: ✗        ✓          ✓
```

The `✗` period is the danger zone. If the `parseMap` `useEffect` fires during this period, it reads `✗` + old URL and overwrites the emitter's correct value with a stale/default value.

## 3. Historical Context: The Tension Chain

Three prior issues form a tension chain around the same queue reset mechanism:

| Issue | Problem | Fix | Queue needed to... |
|-------|---------|-----|--------------------|
| **#359** | Freshly-mounted component sees `null` instead of queued value | Read queued values during initialization (`getInitialStateFromQueue`) | **persist** at mount time |
| **#1099** | Transient flash to old state during concurrent updates | Added `resetQueueOnNextPush` to defer reset to next push | **persist** through the flush |
| **#1293** | Stale values leak across page navigations after state update | Set `autoResetQueueOnUpdate: true` for app router | be **cleared** before new page renders |
| **#1365** | Flash to default when updating state in useEffect | *(this fix)* | **persist** until `useSearchParams` catches up |

#359 and #1099 need the queue to persist. #1293 needs it to clear. #1365 needs it to persist again. The fix must thread this needle.

## 4. Strategy

### 4.1 Part 1: `autoResetQueueOnUpdate: false` + pathname-based reset in NavigationSpy

**File: `packages/nuqs/src/adapters/next/impl.app.ts`**

1. Change `autoResetQueueOnUpdate: true` → `false` (line 103)
2. In `NavigationSpy`, add pathname tracking to detect cross-page navigation and synchronously clear the throttle queue **during render** (before page components):

```typescript
import { usePathname } from 'next/navigation.js'
import { useRef } from 'react'
import { globalThrottleQueue } from '../../lib/queues/throttle'

export function NavigationSpy() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  if (prevPathname.current !== pathname) {
    prevPathname.current = pathname
    // Cross-page navigation: clear stale queued values before children render.
    // Uses reset() (not resetQueues()) to avoid emitting sync events during render.
    globalThrottleQueue.reset()
  }
  useEffect(() => {
    patchHistory()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  return null
}
```

**Why this works:**
- `NavigationSpy` renders **before** page components (earlier sibling in the `NuqsAdapter` children array in `adapters/next/app.ts`)
- `usePathname()` returns the new pathname during the transition render
- `globalThrottleQueue.reset()` is safe during render: only clears `updateMap`/`transitions`/`options`, no events emitted, no AbortController touched
- Idempotent: safe under React StrictMode double-renders and concurrent mode abandoned renders

**For same-page updates:** The existing `resetQueueOnNextPush` mechanism (from #1099) handles cleanup — the queue values persist as a bridge until the next interaction, by which time `useSearchParams` has caught up.

### 4.2 Part 2: Suppress `resetQueues` for nuqs-initiated history calls

**File: `packages/nuqs/src/lib/queues/reset.ts`**

The history patching mechanism calls `spinQueueResetMutex` on every `history.pushState`/`replaceState`. When the mutex drains to 0, it fires `queueMicrotask(resetQueues)`. With `autoResetQueueOnUpdate: false`, the queue still has values after flush, so `resetQueues` would abort them and emit sync events — causing an unnecessary extra render.

Add an `isNuqsInitiated` flag:

```typescript
let mutex = 0
let isNuqsInitiated = false

export function setQueueResetMutex(value = 1): void {
  mutex = value
  if (value > 0) {
    isNuqsInitiated = true
  }
}

export function spinQueueResetMutex(onReset: () => void = resetQueues): void {
  mutex = Math.max(0, mutex - 1)
  if (mutex > 0) {
    return
  }
  if (isNuqsInitiated) {
    isNuqsInitiated = false
    return // Queue values confirmed in URL; resetQueueOnNextPush handles cleanup
  }
  onReset()
}
```

**Why:** When nuqs calls `setQueueResetMutex(3)` before its own `history.replaceState`, the flag is set. As the mutex spins down, the flag prevents the unnecessary `resetQueues`. For external navigations (link clicks, `router.push`), `isNuqsInitiated` is false, so `resetQueues` fires normally. The `onPopState` handler bypasses `spinQueueResetMutex` entirely — back/forward always resets.

**Bonus fix:** This also addresses **Gap 6** (collateral damage to unrelated debounced keys) from the scheduling gaps analysis. Previously, `resetQueues()` would call `debounceController.abortAll()` even for nuqs-initiated updates, aborting unrelated pending debounced keys. Now it only fires for external navigations.

### 4.3 Part 3: E2E test for repro-1365

**Note:** The bug only reproduces in dev mode. The e2e infrastructure uses `next start` (production). The test serves as a regression guard with deterministic assertions on the counter value and effect count. If the scheduling gap ever widens in production (e.g., due to a React or Next.js change), the test will catch it.

**Shared component** (`packages/e2e/shared/specs/repro-1365.tsx`): Uses `parseAsInteger` for `b` (counter, not toggle) so extra effects produce a different final value (deterministic). Logs `effect` on each fire.

**Shared spec** (`packages/e2e/shared/specs/repro-1365.spec.ts`): Uses `setupLogSpy` + `assertLogCount` to verify effect count. Waits for URL to stabilize before checking.

## 5. Scheduling Gaps Addressed

Our fix addresses the highest-risk combination identified in the SCHEDULING-GAPS analysis:

| Gap | Description | Status After Fix |
|-----|-------------|-----------------|
| **Gap 1** (Premature Queue Clearing) | Queue cleared before URL confirms | **Fixed** — `autoResetQueueOnUpdate: false` keeps queue populated |
| **Gap 2** (SyncLane vs Transition Priority Inversion) | `useSyncExternalStore` commits before `useSearchParams` | **Mitigated** — no queue clear = no SyncLane snapshot change during flush |
| **Gap 5** (Adapter searchParams Lag) | `useSearchParams` lags behind URL for shallow updates | **Fixed** — queue bridges the lag |
| **Gap 6** (queueMicrotask resetQueues Collateral Damage) | `resetQueues` aborts unrelated debounced keys | **Fixed** — `isNuqsInitiated` flag prevents firing for nuqs updates |
| **Gap 7** (NUM_HISTORY_CALLS_PER_UPDATE Fragility) | Mutex count depends on Next.js internals | **Mitigated** — pathname reset provides robust cross-page mechanism independent of mutex |
| **Gap 8** (Adapter Divergence) | App Router uses different strategy than React Router | **Reduced** — both now use `autoResetQueueOnUpdate: false` |
| **Gap 3** (parseMap undoing emitter state) | Remains a structural concern for edge cases | **Partially mitigated** — queue retains correct value, so parseMap reads it |
| **Gap 4** (Debounce → Throttle Handoff) | Brief visibility hole during handoff | **Not addressed** — separate issue |
| **Gap 9** (queuedQuerySync Emission Asymmetry) | Throttle queue changes don't emit | **Compatible** — no queue clear during flush means no stale snapshot |

## 6. Impact Assessment on Existing E2E Tests

### 6.1 repro-1293 (State leaking across pages) — **MEDIUM RISK**

The critical regression test. Verifies Page B doesn't see Page A's stale `count` value.

**How our fix handles it:** The pathname-based reset in `NavigationSpy` clears `globalThrottleQueue` synchronously during render when pathname changes from `/a` to `/b`. Since `NavigationSpy` renders before page components, Page B sees a clean queue.

**Key assertion:** `assertLogCount(logSpy, 'b: 1', 0)` — Page B must never render with Page A's count.

**Must pass after fix.**

### 6.2 life-and-death (Optimistic values for mounted components) — **LOW RISK (beneficial)**

Tests that freshly-mounted components see queued (optimistic) values via `NullDetector`. Our fix keeps the queue populated longer → mounted components have **more** time to read queued values. This test should be **easier** to pass.

### 6.3 popstate-queue-reset (Queue clearing on back/forward) — **NO RISK**

Uses the `onPopState` handler which calls `setQueueResetMutex(0)` + `resetQueues()` **directly**, bypassing `spinQueueResetMutex` entirely. Our `isNuqsInitiated` flag has no effect on this path. Completely independent of `autoResetQueueOnUpdate`.

### 6.4 flush-after-navigate (Pending updates don't leak after navigation) — **LOW RISK**

Tests that pending queued updates don't leak to a new page after link navigation. The pathname-based reset in `NavigationSpy` handles this — it clears the throttle queue when the pathname changes.

### 6.5 stitching (Multiple hooks with different debounce/throttle) — **LOW RISK (beneficial)**

Tests sequencing of `a=1` → `a=1&b=1` → `a=1&b=1&c=1` across hooks with different rate limits. With `autoResetQueueOnUpdate: false`, the queue retains values between staggered flushes. The `isNuqsInitiated` flag prevents `resetQueues()` from aborting unrelated debounced keys (directly fixes Gap 6).

### 6.6 repro-1099 (Transient null state) — **NO RISK (beneficial)**

Uses `NullDetector` to catch transient nulls. Our fix keeps the queue populated longer → reduces chance of transient nulls.

### 6.7 repro-359 (Cross-link updates with conditional mounting) — **NO RISK**

Tests that queued values are available during initialization. Our fix keeps the queue populated → initialization reads correct values.

### 6.8 render-count tests — **LOW RISK**

These count exact renders per update. With `autoResetQueueOnUpdate: false`, the queue clear doesn't trigger a `useSyncExternalStore` SyncLane re-render during the flush, which may **reduce** render counts (or keep them the same if the sync event wasn't triggering a visible render). Needs verification.

## 7. Files to Modify

| File | Change |
|------|--------|
| `packages/nuqs/src/adapters/next/impl.app.ts` | `autoResetQueueOnUpdate: false`, add `usePathname` + `useRef` imports, add `globalThrottleQueue` import, add pathname detection in `NavigationSpy` |
| `packages/nuqs/src/lib/queues/reset.ts` | Add `isNuqsInitiated` flag, update `setQueueResetMutex` and `spinQueueResetMutex` |

## 8. Files to Create (already done)

| File | Purpose |
|------|---------|
| `packages/e2e/shared/specs/repro-1365.tsx` | Shared test component (integer counter `b`, logs `effect`) |
| `packages/e2e/shared/specs/repro-1365.spec.ts` | Shared test spec (logSpy, assertLogCount) |
| `packages/e2e/next/src/app/app/(shared)/repro-1365/page.tsx` | Next.js app router page |
| `packages/e2e/next/src/pages/pages/repro-1365.tsx` | Next.js pages router page |
| `packages/e2e/next/specs/shared/repro-1365.spec.ts` | Next.js test registration (app + pages) |
| `packages/e2e/react/src/routes/repro-1365.tsx` | React SPA route |
| `packages/e2e/react/src/routes.tsx` | Added route entry |
| `packages/e2e/react/specs/shared/repro-1365.spec.ts` | React test registration |
| `packages/e2e/react-router/v6/src/routes/repro-1365.tsx` | React Router v6 route |
| `packages/e2e/react-router/v6/specs/shared/repro-1365.spec.ts` | RR v6 test registration |
| `packages/e2e/react-router/v7/app/routes/repro-1365.tsx` | React Router v7 route |
| `packages/e2e/react-router/v7/specs/shared/repro-1365.spec.ts` | RR v7 test registration |
| `packages/e2e/remix/app/routes/repro-1365.tsx` | Remix route |
| `packages/e2e/remix/specs/shared/repro-1365.spec.ts` | Remix test registration |
| `packages/e2e/tanstack-router/src/routes/repro-1365.tsx` | TanStack Router route |
| `packages/e2e/tanstack-router/specs/shared/repro-1365.spec.ts` | TanStack test registration |

## 9. Task Breakdown

### Phase 1: Fix the e2e test spec (logSpy message mismatch)
- [ ] Fix the `assertLogCount` message in repro-1365.spec.ts to match the component's actual log format (`effect 1`, `effect 2`, etc. vs `effect`)
- [ ] Verify the test structure works (mount settle check, click, URL stabilize, assert)

### Phase 2: Apply the core fix
- [ ] **`impl.app.ts`**: Change `autoResetQueueOnUpdate: true` → `false`
- [ ] **`impl.app.ts`**: Add `usePathname` import from `next/navigation.js`
- [ ] **`impl.app.ts`**: Add `useRef` to React imports
- [ ] **`impl.app.ts`**: Import `globalThrottleQueue` from `../../lib/queues/throttle`
- [ ] **`impl.app.ts`**: Add pathname detection logic to `NavigationSpy` (before the useEffect)
- [ ] **`reset.ts`**: Add `isNuqsInitiated` flag
- [ ] **`reset.ts`**: Update `setQueueResetMutex` to set the flag when value > 0
- [ ] **`reset.ts`**: Update `spinQueueResetMutex` to skip callback when nuqs-initiated

### Phase 3: Build and verify
- [ ] `pnpm build --filter nuqs...`
- [ ] Run `pnpm test --filter e2e-next` — all tests must pass
- [ ] Specifically verify: repro-1293, repro-1365, life-and-death, popstate-queue-reset, flush-after-navigate, stitching, repro-1099, repro-359, render-count
- [ ] Run other framework tests if time permits

### Phase 4: Manual verification
- [ ] Build the repro app (`nuqs-repro-1365`) against the fixed nuqs
- [ ] Run in dev mode, click toggle, verify no extra effect fires in console
- [ ] Verify the `a` log doesn't oscillate (`true → false → true`)

## 10. Verification Commands

```bash
# Build nuqs
pnpm build --filter nuqs...

# Run all Next.js e2e tests
pnpm test --filter e2e-next

# Run specific critical tests
pnpm --filter e2e-next exec playwright test repro-1365
pnpm --filter e2e-next exec playwright test repro-1293
pnpm --filter e2e-next exec playwright test life-and-death
pnpm --filter e2e-next exec playwright test popstate-queue-reset
pnpm --filter e2e-next exec playwright test flush-after-navigate
pnpm --filter e2e-next exec playwright test stitching
pnpm --filter e2e-next exec playwright test repro-1099
pnpm --filter e2e-next exec playwright test repro-359
pnpm --filter e2e-next exec playwright test render-count
```
