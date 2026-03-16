# nuqs Architecture Document

## Table of Contents

1. [Overview](#1-overview)
2. [Package Structure](#2-package-structure)
3. [The Lifecycle of a State Update](#3-the-lifecycle-of-a-state-update)
4. [The Two-Tier Queue System](#4-the-two-tier-queue-system)
5. [Cross-Hook Synchronization](#5-cross-hook-synchronization)
6. [The Adapter System](#6-the-adapter-system)
7. [React Scheduling Integration](#7-react-scheduling-integration)
8. [The Parser & Serializer System](#8-the-parser--serializer-system)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Overview

nuqs is a type-safe URL query string state manager for React. It synchronizes
React state with URL search parameters, treating the URL bar as a global,
serialized, shareable piece of state. The core challenge nuqs solves is bridging
two fundamentally different state domains:

- **React state**: synchronous, in-memory, component-scoped, render-driven
- **URL state**: asynchronous, browser-managed, global, subject to rate limits

```
                              ┌─────────────────────────────┐
                              │         URL Bar             │
                              │  ?count=5&search=hello      │
                              └──────┬──────────────▲───────┘
                                     │  read        │  write
                                     │              │
                              ┌──────▼──────────────┴───────┐
                              │         Adapter              │
                              │  (Next.js / React / Remix)   │
                              └──────┬──────────────▲───────┘
                                     │              │
                              ┌──────▼──────────────┴───────┐
                              │      Two-Tier Queue          │
                              │  Throttle (global batching)  │
                              │  Debounce (per-key delay)    │
                              └──────┬──────────────▲───────┘
                                     │              │
                              ┌──────▼──────────────┴───────┐
                              │    Cross-Hook Sync Emitter   │
                              └──────┬──────────────▲───────┘
                                     │              │
                ┌────────────────────┼──────────────┼────────────────────┐
                │                    │              │                    │
         ┌──────▼───────┐    ┌──────▼───────┐    ┌─▼────────────┐      │
         │ useQueryState │    │ useQueryState │    │useQueryStates│  ... │
         │   ("count")   │    │   ("count")   │    │("a","b","c") │      │
         └──────┬────────┘    └──────┬────────┘    └──┬───────────┘      │
                │                    │                │                  │
         ┌──────▼────────┐    ┌──────▼────────┐    ┌──▼───────────┐     │
         │  Component A  │    │  Component B  │    │ Component C   │    │
         └───────────────┘    └───────────────┘    └──────────────┘     │
                                                                        │
                └───────────── React Component Tree ────────────────────┘
```

### Design Principles

1. **Synchronous emit, asynchronous URL write**: React state updates instantly
   via the emitter; the URL catches up after batching and rate-limiting.
2. **Single source of truth**: The URL is the source of truth. React state is
   a parsed, in-memory projection of the URL.
3. **Framework-agnostic core**: All update logic lives in framework-independent
   modules. Adapters are thin bridges to each framework's router.
4. **Batching by default**: Multiple `setState` calls in the same tick merge
   into a single `history.pushState/replaceState` call.

---

## 2. Package Structure

### Monorepo Layout

```
nuqs/
├── packages/
│   ├── nuqs/               # The published library
│   │   ├── src/
│   │   │   ├── index.ts              # Client entry (hooks + parsers)
│   │   │   ├── index.server.ts       # Server entry (loaders, serializers, cache)
│   │   │   ├── testing.ts            # Test utilities (bijection helpers)
│   │   │   │
│   │   │   ├── useQueryState.ts      # Single-key hook (delegates to useQueryStates)
│   │   │   ├── useQueryStates.ts     # Multi-key hook (THE CORE, 462 lines)
│   │   │   ├── parsers.ts            # Parser system & built-in parsers (594 lines)
│   │   │   ├── serializer.ts         # createSerializer (URL generation)
│   │   │   ├── loader.ts             # createLoader (URL parsing, server-side)
│   │   │   ├── cache.ts              # createSearchParamsCache (Next.js RSC)
│   │   │   ├── standard-schema.ts    # Standard Schema v1 integration
│   │   │   ├── defs.ts               # Core type definitions
│   │   │   │
│   │   │   ├── adapters/
│   │   │   │   ├── react.ts          # Pure React (Vite/CRA)
│   │   │   │   ├── next.ts           # Next.js auto-detection
│   │   │   │   ├── next/
│   │   │   │   │   ├── impl.app.ts   # Next.js App Router
│   │   │   │   │   └── impl.pages.ts # Next.js Pages Router
│   │   │   │   ├── remix.ts          # Remix
│   │   │   │   ├── react-router/
│   │   │   │   │   ├── v6.ts         # React Router v6
│   │   │   │   │   └── v7.ts         # React Router v7
│   │   │   │   ├── tanstack-router.ts
│   │   │   │   ├── custom.ts         # Adapter factory for custom frameworks
│   │   │   │   ├── testing.ts        # NuqsTestingAdapter (unit tests)
│   │   │   │   └── lib/
│   │   │   │       ├── context.ts    # React Context for adapter injection
│   │   │   │       ├── defs.ts       # AdapterInterface type
│   │   │   │       ├── key-isolation.ts
│   │   │   │       ├── patch-history.ts
│   │   │   │       └── react-router.ts
│   │   │   │
│   │   │   └── lib/
│   │   │       ├── queues/
│   │   │       │   ├── throttle.ts           # ThrottledQueue class (global)
│   │   │       │   ├── debounce.ts           # DebounceController (per-key)
│   │   │       │   ├── rate-limiting.ts      # Browser-aware defaults
│   │   │       │   ├── reset.ts              # Mutex-based queue reset
│   │   │       │   └── useSyncExternalStores.ts # Multi-key store hook
│   │   │       ├── sync.ts           # Global emitter for cross-hook sync
│   │   │       ├── emitter.ts        # Generic typed event emitter
│   │   │       ├── compose.ts        # Transition function composition
│   │   │       ├── compare.ts        # Query string value comparison
│   │   │       ├── search-params.ts  # URLSearchParams read/write helpers
│   │   │       ├── url-encoding.ts   # Query string rendering
│   │   │       ├── timeout.ts        # AbortSignal-aware setTimeout
│   │   │       ├── with-resolvers.ts # Promise.withResolvers polyfill
│   │   │       ├── safe-parse.ts     # try/catch wrapper for parsers
│   │   │       ├── debug.ts          # Conditional debug logging
│   │   │       └── errors.ts         # Error message catalog
│   │   │
│   │   └── package.json
│   │
│   ├── e2e/                 # End-to-end test suites
│   │   ├── shared/          # Shared specs & Playwright config
│   │   ├── next/            # Next.js test app + specs
│   │   ├── react/           # React SPA test app
│   │   ├── react-router/    # React Router v5/v6/v7
│   │   ├── remix/           # Remix test app
│   │   └── tanstack-router/ # TanStack Router test app
│   │
│   ├── docs/                # Documentation site (nuqs.dev)
│   └── scripts/             # Build & release utilities
```

### Module Dependency Graph (Core)

```
useQueryState.ts
    │
    └──▶ useQueryStates.ts  ◀──── THE CORE ORCHESTRATOR
              │
              ├──▶ adapters/lib/context.ts  (useAdapter, defaultOptions)
              │         │
              │         └──▶ adapters/lib/defs.ts  (AdapterInterface)
              │
              ├──▶ lib/queues/throttle.ts   (globalThrottleQueue)
              │         │
              │         ├──▶ lib/compose.ts
              │         ├──▶ lib/timeout.ts
              │         ├──▶ lib/with-resolvers.ts
              │         └──▶ lib/queues/rate-limiting.ts
              │
              ├──▶ lib/queues/debounce.ts   (debounceController)
              │         │
              │         ├──▶ lib/queues/throttle.ts (feeds into)
              │         └──▶ lib/queues/useSyncExternalStores.ts
              │
              ├──▶ lib/sync.ts              (cross-hook emitter)
              │         │
              │         └──▶ lib/emitter.ts
              │
              ├──▶ lib/compare.ts
              ├──▶ lib/safe-parse.ts
              └──▶ lib/search-params.ts
```

---

## 3. The Lifecycle of a State Update

This section traces a complete state update from a `setState` call through to
the URL changing in the browser address bar and all other hooks re-rendering.

### Phase 1: Invocation and Immediate Sync

When user code calls `setState(newValue)` (from `useQueryState` or
`useQueryStates`), the `update` callback in `useQueryStates.ts:270-386`
executes synchronously:

```
User calls setState(5)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  update() callback (synchronous)                        │
│                                                         │
│  1. Resolve new value (function updater or direct)      │
│  2. Apply clearOnDefault (null if value === default)    │
│  3. Serialize: parser.serialize(value) → "5"            │
│  4. emitter.emit(urlKey, { state: 5, query: "5" })     │
│     ┌───────────────────────────────────────────┐       │
│     │ All other hooks on same key receive this  │       │
│     │ synchronously and call setInternalState() │       │
│     └───────────────────────────────────────────┘       │
│  5. Route to throttle queue or debounce queue           │
│  6. Return Promise<URLSearchParams>                     │
└─────────────────────────────────────────────────────────┘
```

**Step 4 is the critical insight**: the emitter fires synchronously *before*
any queue operation. This means all hooks sharing the same URL key update
their React state in the *same* event loop tick as the caller. The UI
updates immediately even though the URL hasn't changed yet.

### Phase 2: Queue Routing

For each key in the update, the code determines whether to throttle or debounce:

```
                         ┌──────────────┐
                         │  For each    │
                         │  state key   │
                         └──────┬───────┘
                                │
                    ┌───────────▼────────────┐
                    │  limitUrlUpdates.method │
                    │  === 'debounce' ?       │
                    └───────┬──────┬──────────┘
                       yes  │      │  no (default)
                            │      │
               ┌────────────▼┐    ┌▼────────────────────────┐
               │  debounce   │    │ 1. Abort any pending    │
               │  Controller │    │    debounce for this key│
               │  .push()    │    │ 2. globalThrottleQueue  │
               │             │    │    .push()              │
               │  (per-key   │    │ 3. Set doFlush = true   │
               │   isolated) │    │    (global batch)       │
               └─────────────┘    └─────────────────────────┘
```

### Phase 3: Throttled Flush (URL Update)

The `ThrottledQueue.flush()` method uses a two-phase scheduling approach:

```
flush() called
    │
    ├── If resolvers exist → return existing Promise (batching!)
    │
    ▼
Create new Promise via withResolvers()
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: timeout(runOnNextTick, 0, signal)                 │
│                                                             │
│  Defers to the next event loop tick. This allows multiple   │
│  synchronous setState calls to batch into updateMap before  │
│  any flush logic runs.                                      │
│                                                             │
│  setState('a', 1)  ──▶ push to updateMap ──▶ flush() [A]   │
│  setState('b', 2)  ──▶ push to updateMap ──▶ flush() [A]   │
│  setState('c', 3)  ──▶ push to updateMap ──▶ flush() [A]   │
│                                                             │
│  All three share the same Promise [A] because resolvers     │
│  already exist when the 2nd and 3rd calls arrive.           │
└──────────────────────────────┬──────────────────────────────┘
                               │ next tick
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: runOnNextTick()                                   │
│                                                             │
│  Calculate delay:                                           │
│  timeSinceLastFlush = now - lastFlushedAt                   │
│  flushInMs = rateLimitFactor * max(0, timeMs - elapsed)     │
│                                                             │
│  if flushInMs === 0 → call flushNow() immediately           │
│  else → timeout(flushNow, flushInMs, signal)                │
│                                                             │
│  Browser rate limits:                                       │
│    Chrome/Firefox: 50ms                                     │
│    Safari 17+:    120ms                                     │
│    Safari <17:    320ms                                     │
│  rateLimitFactor:                                           │
│    Next.js App Router: 3 (3 history calls per update)       │
│    Others: 1                                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ after delay
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  flushNow() → applyPendingUpdates()                         │
│                                                             │
│  1. Snapshot current search params from adapter             │
│  2. Copy updateMap entries, then clear queue                │
│  3. For each entry:                                         │
│     - null → search.delete(key)                             │
│     - value → search = write(value, key, search)            │
│  4. Apply processUrlSearchParams (user transform)           │
│  5. compose(transitions, () => updateUrl(search, options))  │
│  6. Resolve the Promise with final URLSearchParams          │
│  7. Set resetQueueOnNextPush = true                         │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Adapter Writes to Browser

The adapter's `updateUrl` function performs the actual browser-level change:

```
compose(transitions, () => adapter.updateUrl(search, options))
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Transition Composition                                │
│                                                        │
│  If hooks provided startTransition callbacks:          │
│  transition1(() =>                                     │
│    transition2(() =>                                   │
│      transition3(() =>                                 │
│        adapter.updateUrl(search, options) ◀── final    │
│      )                                                 │
│    )                                                   │
│  )                                                     │
│                                                        │
│  This wraps the URL update in React transitions,       │
│  enabling concurrent features (isPending, Suspense).   │
└────────────────────────┬───────────────────────────────┘
                         │
          ┌──────────────┼──────────────────────┐
          │              │                      │
   ┌──────▼──────┐ ┌────▼─────────┐  ┌─────────▼──────────┐
   │   shallow    │ │ !shallow     │  │  !shallow           │
   │   (default)  │ │ (Next.js)    │  │  (React adapter)    │
   │              │ │              │  │                     │
   │ history.     │ │ history.     │  │ location.assign()   │
   │ replaceState │ │ replaceState │  │ or                  │
   │ or pushState │ │ + router.    │  │ location.replace()  │
   │              │ │ replace(url) │  │ (full page nav)     │
   └──────────────┘ └──────────────┘  └────────────────────┘
```

### Complete Timeline

```
Time ──────────────────────────────────────────────────────────────▶

User code         setState(5)   setState("hello")
                       │              │
Emitter sync     emit("count")  emit("search")     (synchronous)
                       │              │
Other hooks      setInternalState  setInternalState  (synchronous)
                       │              │
Queue push       push("count")  push("search")      (synchronous)
                       │              │
flush() called   [creates Promise]   [returns same Promise]
                       │
                ── tick boundary ──
                       │
runOnNextTick    calculate delay
                       │
                ── rate limit delay (0-320ms) ──
                       │
flushNow()       applyPendingUpdates()
                       │
                  count=5 & search=hello merged into one URL update
                       │
                  history.replaceState(null, '', '?count=5&search=hello')
                       │
Promise resolves  URLSearchParams { count: "5", search: "hello" }
```

---

## 4. The Two-Tier Queue System

The queue system is the heart of nuqs's URL update batching. It exists to solve
a fundamental browser constraint: the History API has rate limits (notably in
Safari: 100 calls per 30 seconds). Naively calling `history.replaceState` for
every `setState` would quickly exceed these limits.

### Tier 1: ThrottledQueue (Global)

There is exactly **one** `ThrottledQueue` instance (`globalThrottleQueue`)
shared across all hooks in the application. It batches all pending key-value
updates and flushes them in a single `history.replaceState/pushState` call.

```
┌──────────────────────────────────────────────────────────────────┐
│                    globalThrottleQueue                            │
│                                                                  │
│  updateMap: Map<string, Query | null>                            │
│  ┌──────────────────────────────────────────┐                    │
│  │  "count"  → "5"                          │                    │
│  │  "search" → "hello"                      │                    │
│  │  "filter" → null  (delete from URL)      │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  options: { history, scroll, shallow }  ← merged from all pushes │
│  transitions: Set<startTransition>      ← collected from pushes  │
│  timeMs: number                         ← maximum across pushes  │
│  resolvers: Promise controls            ← shared across flushes  │
│  controller: AbortController            ← for timeout cleanup    │
│  lastFlushedAt: number                  ← rate limit tracking    │
└──────────────────────────────────────────────────────────────────┘
```

**Option merging rules** (across all pushes in a batch):
- `history`: `'push'` takes precedence over `'replace'`
- `scroll`: `true` takes precedence over `false`
- `shallow`: `false` takes precedence over `true`
- `startTransition`: all collected into a Set, composed at flush time
- `timeMs`: maximum value wins (but clamped to `defaultRateLimit.timeMs` minimum)

### Tier 2: DebounceController (Per-Key)

The `DebounceController` manages isolated `DebouncedPromiseQueue` instances,
one per URL key that uses `limitUrlUpdates: debounce(timeMs)`. This is designed
for high-frequency updates like text inputs where you want to avoid URL churn.

```
┌──────────────────────────────────────────────────────────────────┐
│                    debounceController                             │
│                                                                  │
│  queues: Map<string, DebouncedPromiseQueue>                      │
│  ┌──────────────────────────────────────────┐                    │
│  │  "search" → DebouncedPromiseQueue {      │                    │
│  │               queuedValue: { query: "he" }│                   │
│  │               controller: AbortController │                   │
│  │               resolvers: { promise, ... } │                   │
│  │             }                             │                    │
│  │  "filter" → DebouncedPromiseQueue { ... } │                    │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  throttleQueue: globalThrottleQueue  ← destination for completed │
│  queuedQuerySync: Emitter           ← drives useSyncExternalStore│
└──────────────────────────────────────────────────────────────────┘
```

### How the Tiers Connect

```
                   setState("h")  setState("he")  setState("hel")
                        │              │               │
                        ▼              ▼               ▼
               ┌────────────────────────────────────────────────┐
               │         DebounceController (per-key)           │
               │                                                │
               │  "search" queue:                               │
               │    push("h", 300ms)                            │
               │      → start timer (300ms)                     │
               │    push("he", 300ms)                           │
               │      → abort previous timer, start new (300ms) │
               │    push("hel", 300ms)                          │
               │      → abort previous timer, start new (300ms) │
               │                                                │
               │  After 300ms of silence:                       │
               │    callback fires with value "hel"             │
               └────────────────────┬───────────────────────────┘
                                    │
                                    ▼
               ┌────────────────────────────────────────────────┐
               │         ThrottledQueue (global)                │
               │                                                │
               │    push({ key: "search", query: "hel" })       │
               │    flush() → applyPendingUpdates()             │
               │    → history.replaceState(?, '', '?search=hel')│
               └────────────────────────────────────────────────┘
```

### Debounce ↔ Throttle Interaction

When a key switches from debounce to throttle mode (e.g., a throttled update
arrives for a key that has a pending debounce), the debounce is **aborted** and
the throttled update takes over:

```typescript
// In useQueryStates.ts update() callback:
if (isThrottled) {
  debounceAborts.push(debounceController.abort(urlKey))  // abort debounce
  globalThrottleQueue.push(update, timeMs)                // enqueue throttle
  doFlush = true
}
```

The `abort()` method returns a function that chains the debounced Promise onto
the throttle Promise, ensuring consumers awaiting the debounced update still
resolve correctly:

```
debounce Promise ──(abort)──▶ chains onto ──▶ throttle Promise
                                                     │
                                               resolves with same
                                               URLSearchParams
```

### Promise Stability

A critical design property: **multiple calls to `flush()` in the same tick
return the same Promise**. This prevents over-awaiting:

```typescript
const p1 = globalThrottleQueue.flush(adapter)  // creates resolvers
const p2 = globalThrottleQueue.flush(adapter)  // returns existing resolvers.promise
assert(p1 === p2)  // true!
```

After the flush completes, `resolvers` is set to `null`, so the next `flush()`
call creates a fresh Promise.

---

## 5. Cross-Hook Synchronization

Multiple `useQueryState` or `useQueryStates` hooks can share the same URL key
(intentionally or via `urlKeys` mapping). nuqs keeps them synchronized through
a global typed event emitter.

### The Emitter

```typescript
// lib/sync.ts
export const emitter: Emitter<{ [urlKey: string]: CrossHookSyncPayload }> = createEmitter()

type CrossHookSyncPayload = {
  state: any           // The parsed value (e.g., 5, "hello")
  query: Query | null  // The serialized string (e.g., "5", "hello"), or null to clear
}
```

### Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  useQueryStates mount (useEffect)                           │
│                                                             │
│  For each stateKey in keyMap:                               │
│    urlKey = resolvedUrlKeys[stateKey]                       │
│    emitter.on(urlKey, handler)                              │
│                                                             │
│  Where handler = ({ state, query }) => {                    │
│    setInternalState(currentState => {                       │
│      if (Object.is(currentValue, nextValue)) {              │
│        return currentState  // bail out, no re-render       │
│      }                                                      │
│      stateRef.current = { ...stateRef.current, [key]: val } │
│      queryRef.current[urlKey] = query                       │
│      return stateRef.current                                │
│    })                                                       │
│  }                                                          │
│                                                             │
│  Cleanup: emitter.off(urlKey, handler) for each key         │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Hook Sync Flow

```
Component A                    Emitter                    Component B
useQueryState("count")                                   useQueryState("count")
     │                                                        │
     │  setCount(5)                                           │
     │      │                                                 │
     │      ├── emitter.emit("count", {state:5, query:"5"})   │
     │      │          │                                      │
     │      │          └─────────────────────────────▶ handler fires
     │      │                                          │
     │      │                                    setInternalState(5)
     │      │                                          │
     │      ├── push to throttle queue                 ▼
     │      │                                    Component B re-renders
     │      ▼                                    with count = 5
     │  Component A re-renders
     │  with count = 5
     │
     │  ── tick boundary ──
     │
     ▼  URL updates to ?count=5
```

### Bail-Out Optimization

The `Object.is()` check in the handler prevents unnecessary re-renders. If
Component B already shows `count = 5` and receives a sync event with
`state: 5`, the handler returns the current state reference unchanged, and
React's `useState` bail-out prevents a re-render.

---

## 6. The Adapter System

Adapters are the bridge between nuqs's framework-agnostic core and
framework-specific router APIs. Each adapter implements a common interface
and is injected via React Context.

### Adapter Interface

```typescript
interface AdapterInterface {
  searchParams: URLSearchParams       // Current URL search params (reactive)
  updateUrl: UpdateUrlFunction        // Write new search params to URL
  getSearchParamsSnapshot?: () => URLSearchParams  // Non-reactive read
  rateLimitFactor?: number            // History API calls per logical update
  autoResetQueueOnUpdate?: boolean    // Reset queue after flush?
}

type UpdateUrlFunction = (
  search: URLSearchParams,
  options: Required<{ history: 'replace'|'push', scroll: boolean, shallow: boolean }>
) => void
```

### Context Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  <NuqsAdapter>  (framework-specific provider)                │
│                                                              │
│  Provides via React Context:                                 │
│    • useAdapter(watchKeys: string[]): AdapterInterface        │
│    • defaultOptions: { shallow, clearOnDefault, scroll, ... } │
│    • processUrlSearchParams?: (search) => search              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Application Component Tree                            │  │
│  │                                                        │  │
│  │  useQueryState("count")                                │  │
│  │    → calls useAdapter(["count"])                        │  │
│  │    → receives { searchParams, updateUrl, ... }         │  │
│  │                                                        │  │
│  │  useQueryStates({ a: ..., b: ... })                    │  │
│  │    → calls useAdapter(["a", "b"])                       │  │
│  │    → receives { searchParams, updateUrl, ... }         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Adapter Implementations

#### React Adapter (Pure React / Vite / CRA)

The simplest adapter. Uses the History API directly.

```
┌──────────────────────────────────────────────────────────────┐
│  React Adapter                                               │
│                                                              │
│  Read:  new URLSearchParams(location.search)                 │
│                                                              │
│  Shallow write:                                              │
│    history.pushState/replaceState(state, marker, url)        │
│    emitter.emit('update', search)                            │
│                                                              │
│  Deep write (fullPageNavigationOnShallowFalseUpdates):       │
│    location.assign(url) or location.replace(url)             │
│                                                              │
│  Sync:                                                       │
│    • popstate event → setSearchParams(location.search)       │
│    • internal emitter → setSearchParams(new search)          │
│                                                              │
│  rateLimitFactor: 1 (default)                                │
│  autoResetQueueOnUpdate: default (true)                      │
└──────────────────────────────────────────────────────────────┘
```

#### Next.js App Router Adapter

The most complex adapter due to Next.js's server component architecture.

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js App Router Adapter                                  │
│                                                              │
│  Read:  useSearchParams() (from next/navigation)             │
│         + useOptimistic() for pending non-shallow updates    │
│                                                              │
│  Write (inside startTransition):                             │
│    1. If !shallow: setOptimisticSearchParams(search)         │
│    2. setQueueResetMutex(3)  ← expect 3 history API calls   │
│    3. history.pushState/replaceState(null, '', url)          │
│    4. If options.scroll: window.scrollTo(0, 0)               │
│    5. If !shallow: router.replace(url, {scroll: false})      │
│                     ↑ triggers server component re-render    │
│                                                              │
│  NavigationSpy component:                                    │
│    • Patches history.pushState/replaceState to detect nav    │
│    • On external navigation: spinQueueResetMutex()           │
│    • On popstate: resetQueues() immediately                  │
│                                                              │
│  rateLimitFactor: 3 (NUM_HISTORY_CALLS_PER_UPDATE)           │
│  autoResetQueueOnUpdate: true                                │
└──────────────────────────────────────────────────────────────┘
```

**Why `rateLimitFactor = 3`?** A single nuqs "update" in Next.js App Router
causes up to 3 History API calls: one from `history.replaceState`, one from
`router.replace`, and one internal Next.js call. The rate limiter must account
for all three to avoid exceeding browser limits.

#### Next.js Pages Router Adapter

```
┌──────────────────────────────────────────────────────────────┐
│  Next.js Pages Router Adapter                                │
│                                                              │
│  Read:  router.query → URLSearchParams                       │
│         (filters out dynamic route params)                   │
│                                                              │
│  Write:                                                      │
│    router.push/replace({                                     │
│      pathname: current path,                                 │
│      query: { ...dynamicParams, ...searchParams }            │
│    }, undefined, { shallow, scroll })                        │
│                                                              │
│  Sync:                                                       │
│    • routeChangeStart event → detect external navigation     │
│    • beforeHistoryChange → sync search params                │
│    • isNuqsUpdateMutex → prevent reset on own updates        │
│                                                              │
│  autoResetQueueOnUpdate: false                               │
└──────────────────────────────────────────────────────────────┘
```

#### React Router / Remix Adapter (Shared Factory)

React Router v6, v7, and Remix share a common adapter factory
(`createReactRouterBasedAdapter`):

```
┌──────────────────────────────────────────────────────────────┐
│  React Router / Remix Adapter                                │
│                                                              │
│  Read:  useSearchParams() from router                        │
│         + optimistic state for shallow updates               │
│                                                              │
│  Shallow write:                                              │
│    history.pushState/replaceState(state, marker, url)        │
│    emitter.emit('update', search)                            │
│                                                              │
│  Deep write:                                                 │
│    navigate(url, { replace: options.history === 'replace' }) │
│                                                              │
│  Sync:                                                       │
│    • popstate → read location.search                         │
│    • internal emitter → apply shallow changes                │
│    • router's useSearchParams → server-side changes          │
│                                                              │
│  History patching: at module load time via patchHistory()    │
└──────────────────────────────────────────────────────────────┘
```

### History Patching

Several adapters patch `history.pushState` and `history.replaceState` to detect
URL changes made by external code (framework router, other libraries):

```
┌──────────────────────────────────────────────────────────────┐
│  Original History API                                        │
│                                                              │
│  history.pushState(state, title, url)                        │
│  history.replaceState(state, title, url)                     │
└──────────────────────┬───────────────────────────────────────┘
                       │ patched by nuqs
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Patched History API                                         │
│                                                              │
│  history.pushState = function nuqs_pushState(state, m, url) {│
│    originalPushState.call(history, state, '', url)            │
│    if (url && marker !== '__nuqs__') {                        │
│      // External navigation detected                         │
│      spinQueueResetMutex()                                   │
│      emitter.emit('update', getSearchParams(url))            │
│    }                                                         │
│  }                                                           │
│                                                              │
│  The '__nuqs__' marker distinguishes nuqs's own calls        │
│  from external ones (framework router, user code).           │
└──────────────────────────────────────────────────────────────┘
```

### Queue Reset on Navigation

When the user navigates (clicking a link, browser back/forward), pending
queue updates become stale. The mutex-based reset mechanism handles this:

```
┌────────────────────────────────────────────────────────────────┐
│  Queue Reset Flow                                              │
│                                                                │
│  Scenario: nuqs update causes N history API calls              │
│                                                                │
│  setQueueResetMutex(N)         ← before updateUrl              │
│       │                                                        │
│  history.replaceState(...)     → spinQueueResetMutex()         │
│       mutex = N-1                                              │
│  router.replace(...)           → spinQueueResetMutex()         │
│       mutex = N-2                                              │
│  ...                           → spinQueueResetMutex()         │
│       mutex = 0                → resetQueues()!                │
│                                      │                         │
│                               debounceController.abortAll()    │
│                               globalThrottleQueue.abort()      │
│                                                                │
│  Scenario: popstate (browser back/forward)                     │
│                                                                │
│  window 'popstate' event                                       │
│       │                                                        │
│       → setQueueResetMutex(0)  ← force immediate               │
│       → resetQueues()          ← clear all pending             │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. React Scheduling Integration

nuqs is deeply integrated with React's rendering and scheduling primitives.

### React Primitives Used

| Primitive | Where | Purpose |
|-----------|-------|---------|
| `useState` | `useQueryStates` | Internal state storage for parsed values |
| `useRef` | `useQueryStates` | `stateRef` (current state) and `queryRef` (cached URL values) for synchronous access without re-renders |
| `useCallback` | `useQueryStates` | Memoized `update` function (stable reference across renders) |
| `useMemo` | `useQueryStates` | Memoized `resolvedUrlKeys`, `defaultValues`, and `outputState` |
| `useId` | `useQueryStates` | Unique hook instance ID for debug logging |
| `useEffect` (x2) | `useQueryStates` | (1) Sync URL→state on search param changes; (2) Subscribe/unsubscribe to emitter |
| `useSyncExternalStore` | `useSyncExternalStores` | Subscribe to debounce queue's pending values (for optimistic UI) |
| `useOptimistic` | Next.js App Router adapter | Show optimistic search params during non-shallow transitions |
| `startTransition` | Adapter/user-provided | Wrap URL updates in React transitions for concurrent features |

### Render-Phase State Initialization

The hook does state initialization **in the render phase** (not in useEffect)
to handle concurrent rendering and dynamic key changes:

```typescript
// useQueryStates.ts lines 131-166
// This runs during render, before effects
if (Object.keys(queryRef.current).join('&') !== Object.values(resolvedUrlKeys).join('&')) {
  const { state, hasChanged } = parseMap(keyMap, urlKeys, initialSearchParams, ...)
  if (hasChanged) {
    stateRef.current = state
    setInternalState(state)  // triggers re-render
  }
  queryRef.current = /* update cached queries */
}
```

This dual approach (render-phase + useEffect) ensures:
1. **Immediate response** to key changes during render (concurrent rendering)
2. **Correct hydration** when effects fire after mount (SSR → client)

### startTransition Composition

When multiple hooks in a batch each provide a `startTransition`, they are
collected into a Set and composed at flush time:

```
Hook A: startTransition = useTransition()[1]  // from A's transition
Hook B: startTransition = useTransition()[1]  // from B's transition
Hook C: no startTransition

At flush time, compose() builds:
  transitionA(() =>
    transitionB(() =>
      adapter.updateUrl(search, options)  // ← the actual URL write
    )
  )
```

This ensures that **all** transitions are "aware" of the URL update, so
`isPending` is true for all of them during the update.

### useSyncExternalStore for Queued Values

The debounce controller exposes pending values via `useSyncExternalStore`,
allowing components to show optimistic UI before the URL actually updates:

```
┌──────────────────────────────────────────────────────────────┐
│  useSyncExternalStores(keys, subscribe, getSnapshot)         │
│                                                              │
│  subscribe: keys.map(k => queuedQuerySync.on(k, callback))  │
│  getSnapshot: keys.map(k => getQueuedQuery(k))              │
│                                                              │
│  Returns: Record<string, Query | null | undefined>           │
│                                                              │
│  Cache: JSON.stringify(snapshot) compared to previous         │
│         to maintain referential equality when unchanged       │
│                                                              │
│  This feeds into parseMap():                                 │
│    queuedQuery takes precedence over URL searchParams        │
│    → component shows debounced value before URL updates      │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. The Parser & Serializer System

### Parser Type Hierarchy

```
                        GenericParser<T>
                       ┌───────┴────────┐
                       │                │
                SingleParser<T>    MultiParser<T>
                   type?: 'single'    type: 'multi'
                   parse(string)      parse(string[])
                   serialize?(T)      serialize?(T)
                   eq?(T,T)           eq?(T,T)
                       │                │
                       ▼                ▼
              SingleParserBuilder  MultiParserBuilder
                   │                │
                   │ .withDefault() │ .withDefault()
                   ▼                ▼
              ParserWithDefault<T>
                   │
                   │ .withOptions()
                   ▼
              ParserWithOptions<T>
```

### Builder Pattern

Parsers use an immutable builder pattern where each method returns a new
parser with the added configuration:

```typescript
parseAsInteger                          // SingleParserBuilder<number>
  .withDefault(0)                       // adds defaultValue → non-nullable return
  .withOptions({ history: 'push' })     // adds parser-level options
```

### Built-in Parsers

| Parser | Type | Parse | Serialize |
|--------|------|-------|-----------|
| `parseAsString` | single | identity | identity |
| `parseAsInteger` | single | `parseInt(v, 10)` | `String(v)` |
| `parseAsFloat` | single | `parseFloat(v)` | `String(v)` |
| `parseAsBoolean` | single | `v === 'true'` | `String(v)` |
| `parseAsHex` | single | `parseInt(v, 16)` | `v.toString(16)` |
| `parseAsIndex` | single | `parseInt(v, 10) - 1` | `String(v + 1)` |
| `parseAsTimestamp` | single | `new Date(parseInt(v))` | `d.valueOf().toString()` |
| `parseAsIsoDateTime` | single | `new Date(v)` (ISO) | `d.toISOString()` |
| `parseAsIsoDate` | single | `new Date(v)` (date only) | `YYYY-MM-DD` |
| `parseAsStringEnum` | single | validate against list | identity |
| `parseAsStringLiteral` | single | validate against list | identity |
| `parseAsNumberLiteral` | single | validate against list | `String(v)` |
| `parseAsJson` | single | `JSON.parse` + validator | `JSON.stringify` |
| `parseAsArrayOf` | single | split by separator, parse items | join with separator |
| `parseAsNativeArrayOf` | multi | parse each URL param value | one param per item |

### Option Precedence

Options can be specified at four levels. Higher levels override lower:

```
1. Call-level options     setState(val, { history: 'push' })      ← highest
2. Parser-level options   parseAsInteger.withOptions({ ... })
3. Hook-level options     useQueryState('k', { history: 'push' })
4. Adapter defaults       <NuqsAdapter defaultOptions={{ ... }}>
5. Hard defaults          history:'replace', scroll:false,         ← lowest
                          shallow:true, clearOnDefault:true
```

### clearOnDefault

When `clearOnDefault` is `true` (the default), setting a value equal to the
parser's default value removes the key from the URL entirely:

```
const [count, setCount] = useQueryState('count', parseAsInteger.withDefault(0))

setCount(0)   → URL becomes: /page         (count param removed)
setCount(5)   → URL becomes: /page?count=5
setCount(null) → URL becomes: /page         (count param removed, returns 0)
```

The equality check uses the parser's `eq` function, falling back to `===`.

---

## 9. Testing Strategy

nuqs has a two-layer testing approach: framework-agnostic unit tests for core
logic, and Playwright-based e2e tests across all supported frameworks.

### Unit Tests (Vitest, jsdom)

Located in `packages/nuqs/src/**/*.test.ts(x)`. These test the core logic
independent of any framework router.

#### Test Categories

```
┌─────────────────────────────────────────────────────────────────┐
│  PARSER TESTS (parsers.test.ts)                                 │
│  • Round-trip bijection for all built-in parsers                │
│  • Edge cases: NaN, empty strings, special characters           │
│  • .withDefault() behavior (server-side, reset, change)         │
│  • .withOptions() merging (doesn't reset, preserves defaults)   │
│  • Custom equality functions for arrays                         │
│  • JSON validation with Zod, Valibot, ArkType                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SERIALIZER TESTS (serializer.test.ts)                          │
│  • Null/undefined handling (delete vs preserve)                 │
│  • Base URL merging (string, URL, URLSearchParams)              │
│  • clearOnDefault at global and parser levels                   │
│  • urlKeys remapping                                            │
│  • processUrlSearchParams callback                              │
│  • Special character encoding                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  QUEUE TESTS                                                    │
│                                                                 │
│  throttle.test.ts:                                              │
│  • Enqueue/replace/multi-key                                    │
│  • Option merging (push > replace, scroll true > false, etc.)   │
│  • Transition composition and timeMs tracking                   │
│  • Flush batching (stable Promise across multiple flushes)      │
│  • Infinity timeMs skips adapter calls                          │
│  • processUrlSearchParams integration                           │
│  • Error handling and promise rejection                         │
│                                                                 │
│  debounce.test.ts:                                              │
│  • Timer expiration and debouncing (last value wins)            │
│  • Stable promise for multiple pushes in same period            │
│  • Per-key queue isolation                                      │
│  • Abort and promise chaining                                   │
│  • Interaction with throttle queue                              │
│  • Error handling (sync and async)                              │
│                                                                 │
│  useSyncExternalStores.browser.test.ts:                         │
│  • Subscription and reactivity                                  │
│  • Dynamic key changes                                          │
│  • Non-listened keys don't trigger re-renders                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  HOOK TESTS (browser environment via jsdom)                     │
│                                                                 │
│  useQueryState.browser.test.tsx:                                │
│  • Referential equality (defaults, reset, unrelated changes)    │
│  • Stable setter function reference across renders              │
│  • clearOnDefault at hook/call level                            │
│  • Update sequencing: multiple updates in same tick combine     │
│  • Stable promise across throttle period                        │
│  • Debounce/throttle interaction (abort, flush timing)          │
│  • Promise chaining and resolution order                        │
│  • Race condition prevention (transient null state, #1099)      │
│                                                                 │
│  useQueryStates.browser.test.tsx:                               │
│  • Multi-key set/clear/null semantics                           │
│  • Rendering bail-out (same value → no re-render)               │
│  • URL key remapping with dynamic keys                          │
│  • Cross-hook update combining (same and different hooks)       │
│  • processUrlSearchParams integration                           │
│                                                                 │
│  sync.browser.test.tsx:                                         │
│  • Multiple useQueryState hooks sync state                      │
│  • useQueryState ↔ useQueryStates sync                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  UTILITY TESTS                                                  │
│  • emitter.test.ts: subscribe, unsubscribe, emit                │
│  • compare.test.ts: string/array equality                       │
│  • compose.test.ts: middleware execution order                  │
│  • timeout.test.ts: abort signal cancellation                   │
│  • url-encoding.browser.test.ts: encoding, fuzzy testing        │
│  • with-resolvers.test.ts: polyfill and native detection        │
│  • debug.test.ts: conditional logging                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SERVER TESTS                                                   │
│  • cache.test.ts: createSearchParamsCache, strict mode, async   │
│  • loader.test.ts: URL/Request/string/Record parsing            │
│  • standard-schema.test.ts: Standard Schema v1 compliance       │
│  • api.test.ts: public API surface snapshot tests               │
└─────────────────────────────────────────────────────────────────┘
```

### E2E Tests (Playwright)

Located in `packages/e2e/`. Each supported framework has its own test app and
Playwright configuration. Shared test specs are defined once and run across all
frameworks.

#### Framework Coverage Matrix

```
                         Next.js  React  RR v6  RR v7  Remix  TSR
                         (app+pg)  SPA
basic-io                    x       x      x      x      x     x
push (history)              x       x      x      x      x     x
debounce                    x       x      x      x      x     x
shallow routing             x       x      x      x      x     x
render-count                x       x      x      x      x     x
stitching (sequencing)      x       x      x      x      x     x
hash-preservation           x       x      x      x      x     x
dynamic-segments            x       x      x      x      x     x
referential-stability       x       x      x      x      x     x
key-isolation               x       x      x      x      x     x
flush-after-navigate        x       x      x      x      x     x
popstate-queue-reset        x       x      x      x      x     x
form integration            x       x      x      x      x     x
JSON serialization          x       x      x      x      x     x
native arrays               x       x      x      x      x     x
linking                     x       x      x      x      x     x
routing (push/replace)      x       x      x      x      x     x
scroll behavior             x       x      x      x      x     x
loader                      x       x      x      x      x     x
life-and-death              x       x      x      x      x     x
conditional-rendering       x       x      x      x      x     x
pretty-urls                 x       x      x      x      x     x
repro-359, 982, 1099, 1293  x       x      x      x      x     x
```

Next.js also has framework-specific tests not shared with other frameworks:
- `routing-tour.spec.ts` - multi-page navigation with state accumulation
- `cache.spec.ts` - `createSearchParamsCache` in server components
- `transitions.spec.ts` - `useTransition` + server actions
- `multitenant.spec.ts` - dynamic route segments with shallow/history
- `rewrites.spec.ts` - Next.js URL rewrites
- `useSearchParams.spec.ts` - coexistence with Next.js native hook
- `persist-across-navigation.spec.ts` - query state survival across routes
- Various `repro-*.spec.ts` for Next.js-specific bug regressions

#### Key Behaviors Validated by E2E Tests

**Update Sequencing (stitching.spec.ts)**
```
Validates that multiple setState calls in the same tick and across
staggered ticks produce correct URL updates:

  setState('a', '1')  ──┐
  setState('b', '2')  ──┤ same tick → single URL update: ?a=1&b=2
                         │
  await throttle period
                         │
  setState('c', '3')  ──┘ next tick → URL update: ?a=1&b=2&c=3
```

**Render Counting (render-count.spec.ts)**
```
Uses console.log spies to assert exact render counts:

  Mount:  1 render (initial)
  Update: 2 renders (shallow) or 3 renders (non-shallow with transition)

  This ensures no unnecessary re-renders from queue operations,
  emitter sync, or adapter reactivity.
```

**Queue Reset on Navigation (popstate-queue-reset.spec.ts)**
```
Validates that pending debounced/throttled updates are discarded
when the user navigates away:

  1. Type in input (debounced, pending)
  2. Click browser back
  3. Assert: pending update NOT applied to previous page URL
  4. Assert: queue fully cleared
```

**Referential Stability (referential-stability.spec.ts)**
```
Validates that the setter function maintains identity:

  const [, setCount1] = useQueryState('count')  // render 1
  const [, setCount2] = useQueryState('count')  // render 2
  assert(setCount1 === setCount2)  // same reference
```

**Key Isolation (key-isolation.spec.ts)**
```
Validates that updating parameter 'a' does not cause components
using only parameter 'b' to re-render:

  Component using 'a': re-renders ✓
  Component using 'b': does NOT re-render ✓
```

**Transient Null Prevention (repro-1099.spec.ts)**
```
Validates that state never passes through null during updates:

  URL: ?count=5
  setCount(10)

  At no point during the update cycle should the component
  observe count=null. The test detects any null emission
  from the sync emitter.
```

#### CI Matrix

The CI pipeline tests against multiple framework versions:
- **Next.js**: 14.2.0, 14.2.4, 14.2.8, 15.0.0, 15.1.0, 15.2.0, latest
  - With variations: base path, React compiler, cache components
- **React Router**: v6, v7
- **Remix**: latest
- **TanStack Router**: latest
- **React SPA**: with `FULL_PAGE_NAV_ON_SHALLOW_FALSE` env toggle

### Testing Adapter

`NuqsTestingAdapter` enables unit testing hooks without a real browser or
framework router:

```typescript
render(
  withNuqsTestingAdapter(MyComponent, {
    searchParams: '?count=5',       // initial URL state
    onUrlUpdate: ({ searchParams, queryString, options }) => {
      // assert URL updates
    }
  })
)
```

Features:
- `initialSearchParams` from string, object, or URLSearchParams
- `onUrlUpdate` callback for asserting URL writes
- `hasMemory: true` to simulate real adapter (stores params)
- `rateLimitFactor` for testing rate-limit scenarios
- `resetUrlUpdateQueueOnMount` for test isolation
