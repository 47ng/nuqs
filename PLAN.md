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

Four issues form a tension chain around the same queue reset mechanism:

| Issue | Problem | Fix | Queue needed to... |
|-------|---------|-----|--------------------|
| **#359** | Freshly-mounted component sees `null` instead of queued value | Read queued values during initialization (`getInitialStateFromQueue`) | **persist** at mount time |
| **#1099** | Transient flash to old state during concurrent updates | Added `resetQueueOnNextPush` to defer reset to next push | **persist** through the flush |
| **#1293** | Stale values leak across page navigations after state update | Set `autoResetQueueOnUpdate: true` for app router | be **cleared** before new page renders |
| **#1365** | Flash to default when updating state in useEffect | *(this fix)* | **persist** until `useSearchParams` catches up |

#359 and #1099 need the queue to persist. #1293 needs it to clear. #1365 needs it to persist again. The fix must thread this needle.

## 4. Strategy

The core insight: the queue must **persist during nuqs-initiated updates** (to bridge the gap until `useSearchParams` catches up) but **clear on external navigations** (to prevent stale values on new pages or when external code changes search params).

### 4.1 Existing marker mechanism

The shared `patchHistory` function (`adapters/lib/patch-history.ts`) already distinguishes nuqs vs external history calls using `historyUpdateMarker = '__nuqs__'` passed as the second argument (the unused `title` param) to `pushState`/`replaceState`:

```typescript
// In the shared patchHistory (used by React Router, Remix, etc.):
history.pushState = function nuqs_pushState(state, marker, url) {
  originalPushState.call(history, state, '', url)
  if (url && marker !== historyUpdateMarker) {
    sync(url)  // Only sync for non-nuqs calls
  }
}
```

The React Router adapter passes this marker when calling history:
```typescript
// In react-router.ts updateUrl:
updateMethod.call(history, history.state, historyUpdateMarker, url)
```

**The Next.js App Router adapter does NOT use this mechanism.** It has its own history patching that calls `onHistoryStateUpdate()` for ALL history calls, and relies on the mutex to determine when `resetQueues` fires. This is the root of the problem.

### 4.2 Part 1: `autoResetQueueOnUpdate: false`

**File: `packages/nuqs/src/adapters/next/impl.app.ts`**

Change `autoResetQueueOnUpdate: true` → `false` (line 103). This makes the queue persist through the flush, bridging the gap until `useSearchParams` catches up. The existing `resetQueueOnNextPush` mechanism (from #1099) handles cleanup on the next user interaction.

### 4.3 Part 2: Align history patching with the marker mechanism

**File: `packages/nuqs/src/adapters/next/impl.app.ts`**

The App Router adapter must use the same marker-based detection as the shared `patchHistory`:

**In `updateUrl`:** Pass `historyUpdateMarker` as the second argument:
```typescript
updateMethod.call(history, null, historyUpdateMarker, url)
```
(The `null` state is preserved — Next.js 14.1.0+ needs `null` to make `useSearchParams` reactive to shallow updates.)

**In `patchHistory`:** Check the marker to skip nuqs-initiated calls:
```typescript
history.replaceState = function nuqs_replaceState(state, marker, url) {
  if (marker !== historyUpdateMarker) {
    onHistoryStateUpdate()  // External call → spin mutex, may trigger reset
  }
  return originalReplaceState.call(history, state, marker === historyUpdateMarker ? '' : marker, url)
}
```

nuqs-marked calls pass through without spinning the mutex. External calls (link clicks, `router.push`, etc.) spin the mutex and may trigger `resetQueues` when it drains to 0.

**Adjust mutex value:** Since our own call no longer spins the mutex, the count should reflect only Next.js's cascade calls:
```typescript
// Before (our call + Next.js cascade):
setQueueResetMutex(NUM_HISTORY_CALLS_PER_UPDATE)  // 3

// After (only Next.js cascade):
setQueueResetMutex(options.shallow ? 0 : NUM_HISTORY_CALLS_PER_UPDATE - 1)
```
- **Shallow:** Our call is skipped (marker), Next.js doesn't call `router.replace` → 0 cascade calls → mutex = 0 (no reset expected from cascade)
- **Non-shallow:** Our call is skipped, Next.js's `router.replace` triggers ~2 internal history calls → mutex = 2

### 4.4 Part 3: `isNuqsInitiated` flag for cascade protection

**File: `packages/nuqs/src/lib/queues/reset.ts`**

For non-shallow updates, the mutex accounts for Next.js cascade calls (which don't have the marker). When the mutex drains to 0, we need to skip `resetQueues` because the cascade is a consequence of our own update:

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
    return // Cascade from nuqs update; resetQueueOnNextPush handles cleanup
  }
  onReset()
}
```

**Flow for nuqs non-shallow update:**
1. `setQueueResetMutex(2)`, `isNuqsInitiated = true`
2. Our `replaceState(null, historyUpdateMarker, url)` → marker detected → SKIP
3. Next.js cascade call 1 → no marker → spin → mutex = 1
4. Next.js cascade call 2 → no marker → spin → mutex = 0 → `isNuqsInitiated = true` → skip, clear flag

**Flow for external navigation (after nuqs cascade drained):**
5. External `pushState(state, '', url)` → no marker → `onHistoryStateUpdate()` → spin → mutex = 0 → `isNuqsInitiated = false` → `resetQueues()` fires ✓

### 4.5 Part 4: Pathname-based reset in NavigationSpy for cross-page navigation

**File: `packages/nuqs/src/adapters/next/impl.app.ts`**

The marker + mutex mechanism triggers `resetQueues` via `queueMicrotask` (async). For **cross-page** navigation, we need a **synchronous** guarantee that the queue is cleared before the new page's components render. The pathname-based reset in `NavigationSpy` provides this:

```typescript
export function NavigationSpy() {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  if (prevPathname.current !== pathname) {
    prevPathname.current = pathname
    globalThrottleQueue.reset()  // Synchronous, render-safe, no events emitted
  }
  useEffect(() => {
    patchHistory()
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  return null
}
```

**Why both mechanisms are needed:**

| Navigation type | Marker-based detection | Pathname-based reset | Together |
|----------------|----------------------|---------------------|---------|
| **Cross-page** (pathname changes) | ✓ async (microtask) | ✓ synchronous (render) | Sync guarantee via pathname |
| **Same-page external** (only search params change) | ✓ async (microtask) | ✗ pathname unchanged | Async reset via marker (fast enough for same-page since components are already mounted) |
| **Popstate** (back/forward) | N/A | N/A | `onPopState` handles directly |
| **nuqs update** | Skipped (marker) | Skipped (same pathname) | `resetQueueOnNextPush` handles |

### 4.6 Part 5: E2E test for repro-1365

**Note:** The bug only reproduces in dev mode. The e2e infrastructure uses `next start` (production). The test serves as a regression guard with deterministic assertions on the counter value and effect count. If the scheduling gap ever widens in production (e.g., due to a React or Next.js change), the test will catch it.

**Shared component** (`packages/e2e/shared/specs/repro-1365.tsx`): Uses `parseAsInteger` for `b` (counter, not toggle) so extra effects produce a different final value (deterministic). Logs `effect N` on each fire.

**Shared spec** (`packages/e2e/shared/specs/repro-1365.spec.ts`): Uses `setupLogSpy` + `assertLogCount` to verify effect count. Waits for URL to stabilize before checking.

## 5. Scheduling Gaps Addressed

Our fix addresses the highest-risk combination identified in the SCHEDULING-GAPS analysis:

| Gap | Description | Status After Fix |
|-----|-------------|-----------------|
| **Gap 1** (Premature Queue Clearing) | Queue cleared before URL confirms | **Fixed** — `autoResetQueueOnUpdate: false` keeps queue populated |
| **Gap 2** (SyncLane vs Transition Priority Inversion) | `useSyncExternalStore` commits before `useSearchParams` | **Mitigated** — no queue clear = no SyncLane snapshot change during flush |
| **Gap 5** (Adapter searchParams Lag) | `useSearchParams` lags behind URL for shallow updates | **Fixed** — queue bridges the lag |
| **Gap 6** (queueMicrotask resetQueues Collateral Damage) | `resetQueues` aborts unrelated debounced keys | **Fixed** — marker skips nuqs calls; `isNuqsInitiated` flag skips cascade |
| **Gap 7** (NUM_HISTORY_CALLS_PER_UPDATE Fragility) | Mutex count depends on Next.js internals | **Mitigated** — marker removes our own call from the count; pathname reset provides robust cross-page mechanism independent of mutex |
| **Gap 8** (Adapter Divergence) | App Router uses different strategy than React Router | **Reduced** — both now use `autoResetQueueOnUpdate: false` + marker-based detection |
| **Gap 3** (parseMap undoing emitter state) | Remains a structural concern for edge cases | **Partially mitigated** — queue retains correct value, so parseMap reads it |
| **Gap 4** (Debounce → Throttle Handoff) | Brief visibility hole during handoff | **Not addressed** — separate issue |
| **Gap 9** (queuedQuerySync Emission Asymmetry) | Throttle queue changes don't emit | **Compatible** — no queue clear during flush means no stale snapshot |

## 6. Impact Assessment on Existing E2E Tests

### 6.1 repro-1293 (State leaking across pages) — **MEDIUM RISK**

The critical regression test. Verifies Page B doesn't see Page A's stale `count` value.

**How our fix handles it:** Two layers of protection:
1. **Pathname-based reset** in `NavigationSpy` clears `globalThrottleQueue` synchronously during render when pathname changes from `/a` to `/b`. Since `NavigationSpy` renders before page components, Page B sees a clean queue.
2. **Marker-based detection** in patched history ensures the external navigation (link click) triggers `resetQueues` via microtask as a fallback.

**Key assertion:** `assertLogCount(logSpy, 'b: 1', 0)` — Page B must never render with Page A's count.

**Must pass after fix.**

### 6.2 flush-after-navigate (Pending updates don't leak after navigation) — **MEDIUM RISK**

Tests that pending queued/debounced updates don't leak to a new page after link navigation. Also tests same-page navigation with different search params.

**How our fix handles it:** Two layers:
1. **Cross-page cases:** Pathname-based reset clears the throttle queue synchronously.
2. **Same-page cases (search param changes):** The link navigation calls `history.pushState` without the nuqs marker → patched history detects external call → `onHistoryStateUpdate()` → `spinQueueResetMutex()` → `queueMicrotask(resetQueues)`. Since the mutex is 0 (no pending nuqs update) and `isNuqsInitiated` is false, `resetQueues` fires, aborting pending debounced updates.

**Must verify both cross-page and same-page test cases pass.**

### 6.3 life-and-death (Optimistic values for mounted components) — **LOW RISK (beneficial)**

Tests that freshly-mounted components see queued (optimistic) values via `NullDetector`. Our fix keeps the queue populated longer → mounted components have **more** time to read queued values. This test should be **easier** to pass.

### 6.4 popstate-queue-reset (Queue clearing on back/forward) — **NO RISK**

Uses the `onPopState` handler which calls `setQueueResetMutex(0)` + `resetQueues()` **directly**, bypassing `spinQueueResetMutex` entirely. Our changes to the patched history and `isNuqsInitiated` flag have no effect on this path.

### 6.5 stitching (Multiple hooks with different debounce/throttle) — **LOW RISK (beneficial)**

Tests sequencing of `a=1` → `a=1&b=1` → `a=1&b=1&c=1` across hooks with different rate limits. With `autoResetQueueOnUpdate: false`, the queue retains values between staggered flushes. The marker-based skip + `isNuqsInitiated` flag prevents `resetQueues()` from aborting unrelated debounced keys (directly fixes Gap 6).

### 6.6 repro-1099 (Transient null state) — **NO RISK (beneficial)**

Uses `NullDetector` to catch transient nulls. Our fix keeps the queue populated longer → reduces chance of transient nulls.

### 6.7 repro-359 (Cross-link updates with conditional mounting) — **NO RISK**

Tests that queued values are available during initialization. Our fix keeps the queue populated → initialization reads correct values.

### 6.8 render-count tests — **LOW RISK**

These count exact renders per update. With `autoResetQueueOnUpdate: false`, the queue clear doesn't trigger a `useSyncExternalStore` SyncLane re-render during the flush, which may **reduce** render counts. Needs verification.

## 7. Files to Modify

| File | Change |
|------|--------|
| `packages/nuqs/src/adapters/next/impl.app.ts` | `autoResetQueueOnUpdate: false`; pass `historyUpdateMarker` in `updateUrl`; check marker in patched history; adjust mutex for shallow/non-shallow; add pathname detection in `NavigationSpy` |
| `packages/nuqs/src/lib/queues/reset.ts` | Add `isNuqsInitiated` flag, update `setQueueResetMutex` and `spinQueueResetMutex` |

## 8. Files to Create (already done)

| File | Purpose |
|------|---------|
| `packages/e2e/shared/specs/repro-1365.tsx` | Shared test component (integer counter `b`, logs `effect N`) |
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

### Phase 1: Fix the e2e test spec
- [ ] Fix `assertLogCount` message in repro-1365.spec.ts to match component's log format
- [ ] Verify test structure works (mount settle, click, URL stabilize, assert)

### Phase 2: Apply the core fix to `impl.app.ts`
- [ ] Change `autoResetQueueOnUpdate: true` → `false`
- [ ] Import `historyUpdateMarker` from `../lib/patch-history`
- [ ] In `updateUrl`: pass `historyUpdateMarker` as second arg to `updateMethod.call()`
- [ ] In `patchHistory`: check `marker !== historyUpdateMarker` before calling `onHistoryStateUpdate()`
- [ ] In `patchHistory`: strip marker before calling original (pass `''` for nuqs calls, preserve original for external)
- [ ] Adjust `setQueueResetMutex` value: `options.shallow ? 0 : NUM_HISTORY_CALLS_PER_UPDATE - 1`
- [ ] Add `usePathname` import from `next/navigation.js`
- [ ] Add `useRef` to React imports
- [ ] Import `globalThrottleQueue` from `../../lib/queues/throttle`
- [ ] Add pathname detection logic to `NavigationSpy` (before the useEffect)

### Phase 3: Apply the cascade protection to `reset.ts`
- [ ] Add `isNuqsInitiated` flag
- [ ] Update `setQueueResetMutex` to set the flag when value > 0
- [ ] Update `spinQueueResetMutex` to skip callback when nuqs-initiated and mutex drained to 0

### Phase 4: Build and verify
- [ ] `pnpm build --filter nuqs...`
- [ ] Run `pnpm test --filter e2e-next` — all tests must pass
- [ ] Specifically verify critical tests: repro-1293, repro-1365, life-and-death, popstate-queue-reset, flush-after-navigate, stitching, repro-1099, repro-359, render-count
- [ ] Run other framework tests if time permits

### Phase 5: Manual verification
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
