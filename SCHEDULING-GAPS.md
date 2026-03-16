# Scheduling Gaps & Issues in nuqs Update Pipeline

This document cross-references the architecture of nuqs's update pipeline
(as documented in `ARCHITECTURE.md`) with the React scheduling research
(in `react-research.md`) to identify every timing gap, race condition,
and scheduling issue in the current design.

---

## Table of Contents

1. [The Fundamental Tension](#1-the-fundamental-tension)
2. [Gap 1: Premature Queue Clearing (reset before URL confirms)](#2-gap-1-premature-queue-clearing)
3. [Gap 2: SyncLane vs Transition Priority Inversion](#3-gap-2-synclane-vs-transition-priority-inversion)
4. [Gap 3: The useEffect parseMap Can Undo Emitter-Set State](#4-gap-3-the-useeffect-parsemap-can-undo-emitter-set-state)
5. [Gap 4: Debounce → Throttle Handoff Visibility Hole](#5-gap-4-debounce--throttle-handoff-visibility-hole)
6. [Gap 5: Adapter searchParams Lag (One-Render-Cycle Delay)](#6-gap-5-adapter-searchparams-lag)
7. [Gap 6: The queueMicrotask(resetQueues) Timing](#7-gap-6-the-queuemicrotaskresetqueues-timing)
8. [Gap 7: NUM_HISTORY_CALLS_PER_UPDATE Fragility](#8-gap-7-num_history_calls_per_update-fragility)
9. [Gap 8: autoResetQueueOnUpdate Divergence Across Adapters](#9-gap-8-autoresetqueueonupdate-divergence)
10. [Gap 9: queuedQuerySync Emission Asymmetry](#10-gap-9-queuedquerysync-emission-asymmetry)
11. [StrictMode Amplification of All Gaps](#11-strictmode-amplification)
12. [Summary: The Time Safety Problem](#12-summary-the-time-safety-problem)

---

## 1. The Fundamental Tension

nuqs maintains **three parallel representations** of the same state:

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Emitter State   │   │  Queue State     │   │  URL State       │
│  (synchronous)   │   │  (buffered)      │   │  (async/deferred)│
│                  │   │                  │   │                  │
│  Delivered via   │   │  Held in         │   │  Written via     │
│  emitter.emit()  │   │  throttle/       │   │  adapter.        │
│  to all hooks    │   │  debounce queue  │   │  updateUrl()     │
│  instantly       │   │  until flush     │   │  after flush     │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                       │
         │    synchronous       │   setTimeout(0) +     │  startTransition
         │                      │   rate limit delay    │  (framework-dependent)
         │                      │                       │
         ▼                      ▼                       ▼
    React state            parseMap()              adapter.
    via setState()         fallback source         searchParams
```

The **correctness invariant** is: at any point React renders, the component
must see a consistent value derived from *at least one* of these sources.

The **time safety problem** is: there exists a window after the queue clears
but before the URL confirms, where *none* of the three sources provides the
correct value if a render is triggered during that window.

---

## 2. Gap 1: Premature Queue Clearing

### The Problem

In `ThrottledQueue.applyPendingUpdates()` (`throttle.ts:173-218`), the queue
is cleared **before** the URL is updated:

```
Line 188:  const items = Array.from(this.updateMap.entries())  ← copy items
Line 193:  if (adapter.autoResetQueueOnUpdate) {
Line 194:    this.reset()                                       ← CLEAR QUEUE
Line 195:  }
    ...
Line 207:  compose(transitions, () => {
Line 209:    updateUrl(search, options)                          ← UPDATE URL
Line 210:  })
```

The comment on line 191-192 says this is intentional: *"Let the adapters
choose whether to reset, as it depends on how they handle concurrent
rendering."* The Next.js App Router adapter sets `autoResetQueueOnUpdate: true`.

### Why It's a Problem

Between lines 194 and 209, the queue is empty but the URL hasn't changed.
If `getQueuedQuery(key)` is called during this window (by any `getSnapshot`
from `useSyncExternalStore`), it returns `undefined`. The `parseMap` function
then falls back to `searchParams`, which still has the **old** value:

```typescript
// parseMap (useQueryStates.ts:413-418)
const query =
  queuedQuery === undefined           // ← true, queue just cleared
    ? searchParams?.get(urlKey)        // ← stale! URL hasn't updated yet
    : queuedQuery
```

### Timing Diagram

```
Time ───────────────────────────────────────────────────────────────▶

               Queue has value          Queue empty        URL updated
                    │                       │                   │
 applyPendingUpdates │  this.reset()        │   updateUrl()     │
 ───────────────────┼───────────────────────┼───────────────────┼──
                    │                       │                   │
                    │◀─── DANGER ZONE ─────▶│                   │
                    │   Queue: undefined     │                   │
                    │   URL: old value       │                   │
                    │   Any render here      │                   │
                    │   sees stale state     │                   │
```

### Affected Adapters

- **Next.js App Router**: `autoResetQueueOnUpdate: true` → affected
- **React Router / Remix**: `autoResetQueueOnUpdate: false` → NOT affected
  (queue stays populated until next push, using `resetQueueOnNextPush` flag)
- **React (pure)**: `autoResetQueueOnUpdate: true` (default) → affected

---

## 3. Gap 2: SyncLane vs Transition Priority Inversion

### The Problem (from react-research.md)

`useSyncExternalStore` forces re-renders at **SyncLane** (the highest React
priority). Framework adapters update `searchParams` via **startTransition**
(a lower priority). React processes SyncLane before Transitions, creating an
observable intermediate state.

### Where It Manifests

When the queue is cleared and `queuedQuerySync` emits (see Gap 9 for when
this happens), `useSyncExternalStore`'s subscription callback fires:

```
useSyncExternalStore detects change
    │
    ▼
forceStoreRerender(fiber, SyncLane)      ← highest priority
    │
    ▼
React renders component with:
  queuedQueries = { "count": undefined }  ← queue cleared
  searchParams = old value                 ← transition hasn't resolved
    │
    ▼
parseMap falls back to old searchParams
    │
    ▼
Component shows stale/default value       ← FLASH!
    │
    │  ... later ...
    ▼
startTransition resolves
searchParams = new value
Component re-renders correctly
```

### The Priority Diagram

```
React Priority Lanes:

SyncLane ████████████████████████████  (useSyncExternalStore)
    │
    │  This commits FIRST
    ▼
────────── commit boundary ──────────
    │
    │  This commits SECOND
    ▼
TransitionLane ░░░░░░░░░░░░░░░░░░░░  (useSearchParams via startTransition)
```

Per [React issue #25191](https://github.com/facebook/react/issues/25191),
this is **by design** — `useSyncExternalStore` updates cannot batch with
transitions to prevent tearing. But it means the intermediate "empty queue"
state IS committed as a visible frame.

### Framework Differences

| Adapter | searchParams update mechanism | Priority gap? |
|---------|-------------------------------|---------------|
| Next.js App Router | `startTransition(ACTION_RESTORE)` via patched history | Yes |
| React Router / Remix | `startTransition(() => setSearchParams(...))` via emitter | Yes |
| React (pure) | `setSearchParams(...)` via emitter (no transition) | Smaller, but still async (useEffect) |

---

## 4. Gap 3: The useEffect parseMap Can Undo Emitter-Set State

### The Problem

The emitter sync (step 4 of the update lifecycle) correctly sets React state
via `setInternalState`. However, there's a **second** path that re-derives
state from URL + queue sources, which can *overwrite* the emitter's correct
value with stale data.

### The Two Competing State Paths

**Path A: Emitter Sync** (useQueryStates.ts:196-268)
```
emitter.emit(urlKey, { state: 5, query: "5" })
    │
    ▼
handler fires for all subscribed hooks:
    setInternalState(currentState => {
      stateRef.current = { ...stateRef.current, count: 5 }  ← correct
      queryRef.current[urlKey] = "5"                          ← cached
      return stateRef.current
    })
```

**Path B: parseMap useEffect** (useQueryStates.ts:168-193)
```
useEffect triggered by queuedQueries or searchParams changing:
    parseMap(keyMap, urlKeys, searchParams, queuedQueries, queryRef, stateRef)
        │
        ├── cachedQuery["count"] = "5"  (set by Path A)
        ├── query = queuedQueries["count"] ?? searchParams.get("count")
        │            ↑ undefined (queue cleared)   ↑ null (URL stale)
        │   query = null
        │
        ├── compareQuery("5", null) → NOT equal → cache miss
        ├── hasChanged = true
        ├── value = null (from stale searchParams)
        │
        └── setInternalState({ count: null })   ← OVERWRITES Path A's correct value!
```

### When Both Paths Fire

Both paths fire when `queuedQueries` changes (detected by
`useSyncExternalStore`). The `useSyncExternalStore` re-render causes:
1. The component function body re-executes
2. `queuedQueries` has the new (empty) value
3. The `useEffect` dep `JSON.stringify(queuedQueries)` has changed
4. React schedules the effect
5. Effect calls `parseMap` with empty queue + possibly stale searchParams

The emitter handler (Path A) may have already set the correct state, but
the effect (Path B) runs *after* and overwrites it.

### Dependency Chain Diagram

```
                       ┌─────────────────────────┐
                       │  useSyncExternalStore    │
                       │  detects queue cleared   │
                       └─────────┬───────────────┘
                                 │
                    triggers SyncLane re-render
                                 │
                    ┌────────────┼────────────────┐
                    │            │                 │
                    ▼            ▼                 ▼
             Render phase    useEffect #1      useEffect #2
             (reads new      (parseMap)         (emitter sub)
              queuedQueries) (re-derives state)  (already set
                             from stale data)     correct state)
                                 │
                                 ▼
                         setInternalState(null)
                         ← overwrites correct value!
```

---

## 5. Gap 4: Debounce → Throttle Handoff Visibility Hole

### The Problem

When a debounce timer fires, the debounced value flows through the throttle
queue to the URL. There's a brief window where **neither** queue reports
the value.

### The Handoff Sequence

```typescript
// debounce.ts, DebouncedPromiseQueue callback (created in DebounceController.push):
(update) => {
  this.throttleQueue.push(update)          // ← value now in throttle queue
  return this.throttleQueue
    .flush(adapter, processUrlSearchParams)
    .finally(() => {
      const queuedValue = this.queues.get(update.key)?.queuedValue
      if (queuedValue === undefined) {
        this.queues.delete(update.key)       // ← debounce queue deleted
      }
      this.queuedQuerySync.emit(update.key)  // ← triggers useSyncExternalStore
    })
}
```

And in `DebouncedPromiseQueue.push()` (line 44):
```typescript
this.queuedValue = undefined   // ← cleared before callback returns
```

### The Timeline

```
T0: Debounce timer fires
T1: DebouncedPromiseQueue callback starts
    → this.queuedValue = undefined            ← debounce value GONE
    → throttleQueue.push(update)              ← value in throttle queue
    → throttleQueue.flush() starts
T2: timeout(0) in flush schedules next tick
T3: applyPendingUpdates:
    → this.reset() (if autoResetQueueOnUpdate) ← throttle value GONE
    → updateUrl(search)                        ← URL update starts
T4: .finally() fires:
    → this.queues.delete(key)                  ← debounce queue entry GONE
    → queuedQuerySync.emit(key)                ← triggers useSyncExternalStore

At T4, getQueuedQuery checks:
  1. debounce queue for key → undefined (queue deleted)
  2. throttle queue for key → undefined (reset in T3)
  = returns undefined
```

### Impact

Between T3 and the URL update resolving, `getQueuedQuery` returns
`undefined` for the key. If `useSyncExternalStore` fires (via the
`queuedQuerySync.emit` at T4), components re-derive state from the stale
URL via `parseMap`.

For adapters with `autoResetQueueOnUpdate: false` (React Router/Remix),
the throttle queue still has the value at T4 (not cleared in T3), so
`getQueuedQuery` falls back successfully. This gap primarily affects
**Next.js App Router** and **React (pure)**.

---

## 6. Gap 5: Adapter searchParams Lag (One-Render-Cycle Delay)

### The Problem

Each adapter updates its `searchParams` state through mechanisms that
introduce at least one render cycle of lag after the URL write.

### Per-Adapter Analysis

**React Adapter** (`adapters/react.ts`):
```typescript
const onEmitterUpdate = (search: URLSearchParams) => {
  setSearchParams(applyChange(search, watchKeys, true))  // ← useEffect callback
}
emitter.on('update', onEmitterUpdate)
```
The emitter callback runs in a `useEffect`, which fires *after* the render
in which the URL was updated. So `adapter.searchParams` is one render behind.

**React Router / Remix** (`adapters/lib/react-router.ts`):
```typescript
function onEmitterUpdate(search: URLSearchParams) {
  startTransition(() => {                                  // ← wrapped in transition!
    setSearchParams(applyChange(search, watchKeys, true))
  })
}
```
The `startTransition` wrapper makes the update even lower priority. The
adapter's `searchParams` won't reflect the change until the transition
completes.

**Next.js App Router** (`adapters/next/impl.app.ts`):
```typescript
const [optimisticSearchParams, setOptimisticSearchParams] =
  useOptimistic<URLSearchParams>(searchParams)
// ...
startTransition(() => {
  if (!options.shallow) {
    setOptimisticSearchParams(search)      // ← only for non-shallow!
  }
  history.replaceState(null, '', url)       // ← triggers Next.js's own startTransition
})
```
For **shallow** updates (the default), `setOptimisticSearchParams` is NOT
called. The adapter relies entirely on `useSearchParams()` reacting to
the `history.replaceState`, which happens via Next.js's own `startTransition`.

### The Diagram

```
Time ──────────────────────────────────────────────────────────────▶

          updateUrl()        Adapter emitter/     searchParams
          called             transition fires      reflects change
             │                    │                     │
             │◀── 1+ render ─────▶│◀── transition ─────▶│
             │    cycles          │    lane delay       │
             │                    │                     │
             │◀────────── TOTAL LAG ───────────────────▶│
```

During this lag, `adapter.searchParams` used by `useQueryStates` as
`initialSearchParams` has the **old** value. If the queue is also empty
(Gap 1), `parseMap` has no correct source.

---

## 7. Gap 6: The queueMicrotask(resetQueues) Timing

### The Problem

In the Next.js App Router adapter, queue reset happens via `queueMicrotask`:

```typescript
// impl.app.ts:22-32
function onHistoryStateUpdate() {
  spinQueueResetMutex(() => {
    queueMicrotask(resetQueues)
  })
}
```

Microtasks execute:
- After the current synchronous JavaScript
- Before the next macrotask (setTimeout, MessageChannel)
- **Before React's scheduler picks up pending work** (React uses
  MessageChannel for scheduling)

### The Race

```
Synchronous:
  applyPendingUpdates() → this.reset() → queue cleared
  compose(transitions, () => {
    startTransition(() => {
      history.replaceState(...)             ← triggers patched history
        → onHistoryStateUpdate()
        → spinQueueResetMutex()
          → queueMicrotask(resetQueues)     ← SCHEDULED as microtask
    })
  })

Microtask checkpoint:
  resetQueues() fires                       ← before React processes renders
    → debounceController.abortAll()         ← clears all debounce queues
    → globalThrottleQueue.abort()           ← already empty, returns []
    → queuedQuerySync.emit for aborted keys

React scheduler (macrotask via MessageChannel):
  Process SyncLane updates from useSyncExternalStore
  Process Transition updates from startTransition
```

The `queueMicrotask(resetQueues)` runs **between** the history API call
and React's scheduler processing. This means `debounceController.abortAll()`
can clear debounce queues that were not part of the current flush, disrupting
unrelated pending debounced updates.

### Scenario: Collateral Damage to Unrelated Debounced Keys

```
Key "count" is being throttle-flushed
Key "search" has a pending debounce (user is still typing)

flush("count") → updateUrl → history.replaceState
  → onHistoryStateUpdate → spinQueueResetMutex → when mutex=0:
    queueMicrotask(resetQueues)

resetQueues():
  debounceController.abortAll()     ← ABORTS "search" debounce too!
  globalThrottleQueue.abort()
```

The user's in-progress typing for "search" is aborted as collateral damage
of the "count" flush completing.

---

## 8. Gap 7: NUM_HISTORY_CALLS_PER_UPDATE Fragility

### The Problem

```typescript
// impl.app.ts:15
const NUM_HISTORY_CALLS_PER_UPDATE = 3
```

This constant controls the mutex value that determines when queues reset.
It represents the expected number of history API calls that a single nuqs
`updateUrl` generates in Next.js App Router.

### Why 3?

1. `history.replaceState` by nuqs's `updateUrl` → +1
2. Next.js's patched `history.replaceState` internally calls the original → +1
3. `router.replace()` (for non-shallow) triggers another history call → +1

### Fragility Vectors

| Scenario | Risk |
|----------|------|
| Next.js adds/removes internal history calls | Mutex count wrong |
| Next.js changes history patching strategy | Mutex count wrong |
| Shallow update (no `router.replace`) | Only 2 calls, but mutex set to 3 |
| Third-party code patches history | Extra calls spin mutex too fast |
| React 19+ changes transition batching | Timing assumptions change |

**For shallow updates**: `router.replace` is NOT called (impl.app.ts:90-96),
so only ~2 history calls occur. But the mutex is always set to 3 (line 78).
This means the mutex takes one extra spin to reach 0, delaying the
`queueMicrotask(resetQueues)` call. This is a minor timing inaccuracy that
could cause the queue reset to fire at a different time than expected.

### Observed Evidence

The comment on line 13-14 references two GitHub issues where this value
was adjusted, confirming it has been a source of bugs:
```
// See: https://github.com/47ng/nuqs/issues/603#issuecomment-2317057128
// and https://github.com/47ng/nuqs/discussions/960#discussioncomment-12699171
```

---

## 9. Gap 8: autoResetQueueOnUpdate Divergence Across Adapters

### The Problem

Different adapters use different queue reset strategies:

| Adapter | autoResetQueueOnUpdate | Reset mechanism |
|---------|----------------------|-----------------|
| Next.js App Router | `true` | Reset inside `applyPendingUpdates`, plus mutex-based `resetQueues` via patched history |
| Next.js Pages Router | `false` | Lazy reset via `resetQueueOnNextPush` |
| React Router / Remix | `false` | Lazy reset via `resetQueueOnNextPush` |
| React (pure) | `true` (default) | Reset inside `applyPendingUpdates`, plus `patchHistory` emitter |
| Testing | configurable | Depends on test setup |

### The Consequence

The time safety properties differ per adapter:

**`autoResetQueueOnUpdate: true`** (Next.js App Router, React):
- Queue cleared immediately in `applyPendingUpdates`
- `getQueuedQuery(key)` returns `undefined` immediately
- **Vulnerable** to Gap 1 (premature clearing)
- Relies on URL catching up before next render

**`autoResetQueueOnUpdate: false`** (React Router, Remix, Pages Router):
- Queue stays populated until next `push()` call
- `getQueuedQuery(key)` continues to return the correct value
- **Protected** from Gap 1
- But queue may contain stale values if navigation occurs without a push

### Double Reset in Next.js App Router

The Next.js App Router has **two** reset mechanisms that can both fire:

```
1. autoResetQueueOnUpdate: true  → this.reset() in applyPendingUpdates
2. queueMicrotask(resetQueues)   → fires when mutex spins down

These are redundant. #1 clears the throttle queue immediately.
By the time #2 fires, the throttle queue is already empty.
But #2 also calls debounceController.abortAll(), which can
abort UNRELATED pending debounce queues (see Gap 6).
```

---

## 10. Gap 9: queuedQuerySync Emission Asymmetry

### The Problem

`queuedQuerySync` (the emitter that drives `useSyncExternalStore`) is
emitted in some code paths but not others, creating inconsistent
observability.

### Emission Map

| Event | queuedQuerySync emitted? | Notes |
|-------|-------------------------|-------|
| `debounceController.push()` | Yes (line 119) | On every debounce enqueue |
| `debounceController.abort()` | Yes (line 137) | When debounce aborted |
| `debounceController.abortAll()` | Yes (per key, line 155) | When all aborted |
| Debounce `.finally()` callback | Yes (line 112) | After throttle flush completes |
| `ThrottledQueue.push()` | **No** | Queue populated silently |
| `ThrottledQueue.reset()` | **No** | Queue cleared silently |
| `ThrottledQueue.abort()` | **No** (but see below) | |
| `resetQueues()` | Yes, indirectly | Calls abort(), emits for returned keys |

### The Asymmetry

For **throttle-only** keys (the common case — throttle is the default):
- `globalThrottleQueue.push()` adds the value — **no emission**
- `globalThrottleQueue.reset()` clears the value — **no emission**
- `useSyncExternalStore` is never notified of the change

This means for throttle-only keys, `queuedQueries` from
`useSyncExternalStore` is **stale**. It was read during the initial render
(or the last re-render triggered by something else) and doesn't update when
the throttle queue changes.

### Why This Mostly Works

The emitter sync (useQueryStates.ts:306) fires `emitter.emit()` which
triggers `setInternalState()` in other hooks. This React state update
triggers a re-render, during which `useSyncExternalStore`'s `getSnapshot`
is called and reads the throttle queue value.

So the throttle queue value IS read during renders — just not via an
explicit subscription notification. It piggybacks on other render triggers.

### When It Breaks

If a render is triggered by something OTHER than the emitter sync (e.g., a
parent component re-render, a context change, or a `useSyncExternalStore`
notification from a DIFFERENT key), `getSnapshot` may read a stale throttle
queue value that has since been cleared.

The `queuedQueries` dependency in the `useEffect` (`JSON.stringify(queuedQueries)`)
won't detect this change because `useSyncExternalStore` returned a cached
reference.

---

## 11. StrictMode Amplification

### How StrictMode Widens Every Gap

React StrictMode (enabled by default in Next.js) amplifies all timing gaps
through three mechanisms:

#### 1. Double Component Render

The component function body executes twice per logical render. This means:
- `useSyncExternalStore`'s `getSnapshot` is called more times
- More opportunities to observe intermediate queue states
- The render phase takes longer, widening the window between queue reset
  and URL update

#### 2. Double Effect Execution (setup → cleanup → setup)

Effects go through: first setup → cleanup → second setup. For
`useSyncExternalStore`, this means the subscription is torn down and
re-established, introducing additional scheduling work. For the `parseMap`
`useEffect`, it means the effect fires twice, doubling the chances of
reading stale data.

#### 3. Extra getSnapshot Verification

In `__DEV__`, React calls `getSnapshot()` an additional time to verify
caching behavior. This extra call samples the store at a different
point in time, increasing the surface area for observing cleared queues.

### The Compound Effect

```
In production:

  queue cleared → (small gap) → URL updated → render → correct

In development (StrictMode):

  queue cleared → render #1 → render #2 → effect setup →
    effect cleanup → effect setup #2 → URL updated → render → correct
                     ↑
                     Multiple renders in the gap
                     where queue is empty and URL is stale
```

---

## 12. Summary: The Time Safety Problem

### The Core Defect

nuqs's update pipeline has a **structural time safety problem**: the queue
(which provides optimistic state) is cleared before the URL (the source
of truth) confirms the new value. This creates a window where a component
can render with neither the queued value nor the correct URL value.

```
                    VALUE AVAILABLE FROM:
                    Queue    URL     Emitter State
                    ─────    ───     ─────────────
Before setState:     -        -          -
After emit:          -        -          ✓ (correct)
After queue push:    ✓        -          ✓
During flush:        ✓        -          ✓
After reset():       ✗        -          ✓ (but may be overwritten)
During updateUrl:    ✗        -          ✓ (but may be overwritten)
After updateUrl:     ✗        ✓ (async)  ✓
URL transition done: ✗        ✓          ✓

The ✗ period is the danger zone. If the parseMap useEffect
fires during this period, it reads ✗ + old URL and overwrites
the emitter state ✓ with a stale value.
```

### What Makes It Intermittent

The bug is intermittent because:
1. It requires a render to be triggered during the ✗ window
2. In production, this window is very small (~0-50ms)
3. In dev (StrictMode), the window is wider (double renders, extra effects)
4. For throttle-only keys, `queuedQuerySync` doesn't emit, so no render
   is triggered by the queue clearing itself
5. For debounce keys, the `.finally()` callback DOES trigger a render,
   making the bug more reproducible

### Per-Adapter Risk Profile

| Adapter | Gap 1 | Gap 2 | Gap 3 | Gap 4 | Gap 5 | Gap 6 | Overall Risk |
|---------|-------|-------|-------|-------|-------|-------|-------------|
| Next.js App Router | High | High | High | High | High (shallow) | High | **Highest** |
| React (pure) | Medium | Low | Medium | Medium | Medium | N/A | Medium |
| React Router / Remix | Low | High | Low | Low | High | N/A | **Low-Medium** |
| Next.js Pages Router | Low | Low | Low | Low | Low | N/A | **Low** |

The Next.js App Router is the highest risk because it combines:
- `autoResetQueueOnUpdate: true` (Gap 1)
- `startTransition` for all history updates (Gap 2)
- No optimistic bridging for shallow updates (Gap 5)
- `queueMicrotask(resetQueues)` that can abort unrelated debounces (Gap 6)
- `NUM_HISTORY_CALLS_PER_UPDATE = 3` mutex (Gap 7)
- StrictMode enabled by default

### The Invariant That Should Hold

For the system to be time-safe, this invariant must hold at every render:

> **For every key, at least one of (queuedQuery, searchParams) must
> reflect the most recently set value, OR the emitter-set
> internalState must not be overwritten by parseMap.**

Currently, this invariant can be violated when:
1. The queue clears (queuedQuery → undefined)
2. searchParams hasn't caught up (still old value)
3. parseMap fires and detects a cache miss (cached query "5" ≠ current query null)
4. parseMap writes `null` to state, overwriting the emitter's correct value
