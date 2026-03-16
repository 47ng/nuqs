# React Dev Mode vs Production: useSyncExternalStore Behavior Differences

## Executive Summary

The "flash to default" bug observed in development mode but not production is caused by **two compounding mechanisms**, both specific to React's development mode:

1. **React StrictMode's effect double-firing** (setup -> cleanup -> setup) causes the `useSyncExternalStore` subscription to be torn down and re-established, creating a window during which store changes from `setTimeout(fn, 0)` callbacks can be observed as intermediate states.

2. **React StrictMode's double-render of component bodies** means the component function executes twice per logical render. Combined with `useSyncExternalStore`'s `getSnapshot` being called during each render pass, and the store's value being read at different points in time, the intermediate "cleared queue" state becomes visible as a rendered frame.

In production, neither mechanism exists. The component renders once, the subscription is established once, and the `setTimeout(fn, 0)` -> `queue.reset()` -> `history.replaceState` sequence completes atomically from React's perspective because by the time React processes the SyncLane update from the store change, `useSearchParams` has already caught up via Next.js's patched `history.replaceState`.

## Detailed Analysis

### 1. Why Steps 4-5 Happen in Dev but Not Production

#### The Core Timing Problem

The bug's timeline in dev mode:

```
T0: User clicks -> setState pushes {a: true} to throttle queue
T1: useSyncExternalStore reads queue -> getSnapshot returns "true" -> renders with a=true
T2: setTimeout(fn, 0) fires -> flushes queue -> calls history.replaceState(?a=true) -> calls queue.reset()
T3: useSyncExternalStore detects cleared queue -> getSnapshot returns undefined -> forces SyncLane re-render
T4: Component re-renders: no queued value, useSearchParams hasn't caught up yet -> falls back to default (false)
T5: useSearchParams catches up (via Next.js's startTransition from patched replaceState) -> re-renders with a=true
```

The critical question is: **why does T3-T4 produce a visible intermediate render in dev but not prod?**

#### StrictMode Double Effect Execution

In development with StrictMode (which Next.js enables by default), React runs effects with the sequence: **setup -> cleanup -> setup**. For `useSyncExternalStore`, the subscription effect (`subscribeToStore`) goes through this cycle:

1. **First setup**: Subscribe to external store, registering `handleStoreChange` callback
2. **Cleanup**: Unsubscribe from the store
3. **Second setup**: Re-subscribe to the store

This double subscription cycle is normally harmless for simple stores. However, it interacts with the `setTimeout(fn, 0)` timing in a subtle way. The cleanup-and-resubscribe cycle introduces additional microtask/macrotask scheduling work that can shift the relative timing of when the `setTimeout` callback fires versus when React processes the subscription's change notification.

#### StrictMode Double Component Render

More critically, StrictMode calls the component function body twice per logical render. This means `getSnapshot` is called more times in dev mode. From the [React source code](https://github.com/facebook/react/blob/v18.2.0/packages/react-reconciler/src/ReactFiberHooks.new.js) in `mountSyncExternalStore`:

```javascript
// In __DEV__ mode only:
if (__DEV__) {
  if (!didWarnUncachedGetSnapshot) {
    const cachedSnapshot = getSnapshot();
    if (!is(nextSnapshot, cachedSnapshot)) {
      console.error(
        'The result of getSnapshot should be cached to avoid an infinite loop',
      );
      didWarnUncachedGetSnapshot = true;
    }
  }
}
```

React calls `getSnapshot()` **twice** in development to verify caching behavior. While nuqs's `useSyncExternalStores` wrapper properly caches via `cacheRef`, the double invocation still means the store's state is sampled at two points in time during each render, increasing the surface area for observing intermediate states.

#### The SyncLane Forcing Mechanism

When the external store changes (queue.reset() clears the updateMap), `useSyncExternalStore`'s `handleStoreChange` calls `checkIfSnapshotChanged`, which detects the change and calls `forceStoreRerender`:

```javascript
function forceStoreRerender(fiber) {
  const root = enqueueConcurrentRenderForLane(fiber, SyncLane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
  }
}
```

This schedules a **SyncLane** update -- the highest priority lane. This update **cannot be batched** with the lower-priority transition update that Next.js's patched `history.replaceState` dispatches via `startTransition`. As documented in [React issue #25191](https://github.com/facebook/react/issues/25191), `useSyncExternalStore` updates are intentionally flushed before transition updates, creating observable intermediate states.

In **development mode**, the double render amplifies this: the SyncLane update from the cleared queue forces a synchronous re-render that commits the "no value" state to the DOM before the `startTransition` from Next.js's history patching has a chance to update `useSearchParams`.

In **production mode**, the same SyncLane vs Transition priority gap exists, but:
- The component body runs only once per render
- Effects run only once (no cleanup-resubscribe cycle)
- The overall timing is tighter, and the `startTransition` update from Next.js's patched `history.replaceState` resolves within the same batching window

### 2. Does React's Dev Mode Use a Different Scheduler?

**No, React does not use a fundamentally different scheduler in dev mode.** The core scheduling infrastructure (lanes, SyncLane, transitions, etc.) is identical. However, dev mode adds several layers that change observable timing:

#### What `__DEV__` Changes in the Scheduler Path

1. **Double component render**: Component function body is called twice, with console logs suppressed on the second call ([React PR #18547](https://github.com/facebook/react/pull/18547/files/b7e2345755e07c1174b3a755a78f36a6df7fa827)). This doubles the time spent in the render phase.

2. **Double effect execution**: Effects go through setup -> cleanup -> setup on mount ([React docs](https://react.dev/reference/react/StrictMode)). This means subscriptions are torn down and re-established.

3. **Extra `getSnapshot` calls**: In `__DEV__`, `getSnapshot` is called an additional time to verify caching, as shown in the source code above.

4. **Additional validation warnings**: Various consistency checks that don't exist in production, adding execution time between critical timing points.

#### The Tearing Check Mechanism

React does have a tearing detection mechanism that runs in **both** dev and production: `isRenderConsistentWithExternalStores`. This walks the fiber tree before commit and compares the rendered snapshot against the current store value. If they differ, React forces a synchronous re-render. This mechanism is **not** dev-only -- it applies to concurrent renders in both modes.

However, the **extra render pass from StrictMode** means there are more opportunities for the tearing check to observe store inconsistencies, because more time passes between the start of a render and the commit phase.

### 3. How useSyncExternalStore Handles Rapid Store Changes (Dev vs Prod)

#### The value -> undefined -> value Sequence

In this bug, the store value changes: `queued_value` -> `undefined` (queue cleared) -> `value` (useSearchParams catches up).

**In production:**
- The `queue.reset()` triggers `forceStoreRerender` at SyncLane
- But React 18's automatic batching in `setTimeout` contexts means this SyncLane update may be processed in the same microtask batch as the subsequent `startTransition` from Next.js's patched `history.replaceState`
- The transition update that syncs `useSearchParams` runs quickly enough that by the time React commits, both the queue snapshot (undefined) and the search params snapshot (has value) are available, resulting in the final resolved value being correct

**In development:**
- The double render means the SyncLane update from `queue.reset()` goes through two render cycles
- Each render cycle calls `getSnapshot` multiple times (baseline + `__DEV__` verification call)
- The StrictMode effect double-fire means subscription callbacks may fire at slightly different timing
- The `startTransition` from Next.js's history patching hasn't resolved yet when the SyncLane commits
- Result: an intermediate frame where `queuedQuery` is undefined AND `searchParams` hasn't updated yet

#### Why the Timing Gap Matters

The key insight from [React issue #24831](https://github.com/facebook/react/issues/24831) is that `useSyncExternalStore` updates **cannot be batched with transition updates**. Sebastian Markbage explained: "using `useSyncExternalStore` inherently requires 'less batchable' updates to maintain consistency with external mutable stores." The SyncLane update is flushed and committed before the transition from `useSearchParams` resolves.

In production, this gap is negligibly small. In development, the double-render and double-effect overhead widens this gap enough to produce a visible intermediate state.

### 4. Does Next.js Dev Mode Add Additional Re-rendering?

**Yes, Next.js dev mode adds several rendering-related behaviors:**

#### HotReloader Component Wrapping

In dev mode, Next.js wraps the app in a `HotReloader` component (visible in the [app-router.tsx source](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/app-router.tsx)):

- Dev: Content wrapped in `<HotReloader>` with dev overlay and error boundary
- Prod: Content wrapped in `<RootErrorBoundary>` directly (no HotReloader)

The HotReloader can trigger component re-mounts during Fast Refresh, though this is only relevant during code edits, not during normal runtime interactions.

#### Debug Instrumentation

In dev mode, Next.js exposes `window.nd = { router, cache, tree }` and creates instrumented navigation promises for Suspense DevTools. This adds overhead but doesn't directly cause extra renders.

#### Route Rendering on Demand

From the [Next.js docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params): "In development, routes are rendered on-demand, so `useSearchParams` doesn't suspend." In production, static pages using `useSearchParams` require Suspense boundaries. This difference means the component's rendering lifecycle differs between dev and prod, potentially affecting the timing of when `useSearchParams` reflects URL changes.

#### History Patching Differences

Next.js's history patching (as seen in the app-router source) wraps `history.replaceState` updates in `startTransition`:

```javascript
startTransition(() => {
  dispatchAppRouterAction({
    type: ACTION_RESTORE,
    url: new URL(url ?? href, href),
    historyState: appHistoryState,
  })
})
```

The `startTransition` means the `useSearchParams` update is a **transition** (low priority), while the `useSyncExternalStore` update from `queue.reset()` is at **SyncLane** (highest priority). In dev mode with StrictMode's double render, the SyncLane update commits visibly before the transition completes.

### 5. Known React Issues with useSyncExternalStore + setTimeout

Several related issues have been filed:

1. **[facebook/react#25191](https://github.com/facebook/react/issues/25191)**: "Is the current useSyncExternalStore batching & flushing behaviour intended?" -- Documents that `useSyncExternalStore` updates from outside event handlers can create **visible intermediate states** because they flush at SyncLane before other updates. This is the closest match to the observed bug.

2. **[facebook/react#24831](https://github.com/facebook/react/issues/24831)**: "useSyncExternalStore update not batched within unstable_batchedUpdates" -- Confirms that `useSyncExternalStore` updates in `setTimeout` callbacks are committed independently before other state updates.

3. **[facebook/react#27266](https://github.com/facebook/react/issues/27266)**: "Rendering Twice in StrictMode with useSyncExternalStore Official Example" -- Confirms that every store value change causes the entire hook to re-render twice in StrictMode.

4. **[facebook/react#25039](https://github.com/facebook/react/issues/25039)**: "useSyncExternalStore subscribes too late in Suspense" -- Documents subscription timing gaps.

5. **[facebook/react#25565](https://github.com/facebook/react/issues/25565)**: "useSyncExternalStore does not update internal value if a setState is also called" -- Documents interaction issues between external store updates and regular state updates.

### 6. How useSearchParams Reacts to history.replaceState

#### The Update Chain

When nuqs calls `history.replaceState(null, '', url)`:

1. **Next.js's patched replaceState fires**: The monkey-patched `history.replaceState` in `app-router.tsx` intercepts the call
2. **Checks for internal markers**: If the state doesn't have `__NA` or `_N` markers (nuqs passes `null`), it's treated as an external URL change
3. **Dispatches ACTION_RESTORE inside startTransition**:
   ```javascript
   startTransition(() => {
     dispatchAppRouterAction({ type: ACTION_RESTORE, url: new URL(url), ... })
   })
   ```
4. **Router state updates**: The canonical URL in the router tree is updated
5. **useSearchParams derives new value**: `searchParams` is derived from the updated router state
6. **Components re-render**: Components using `useSearchParams` re-render with the new value

#### Timing Difference: Dev vs Prod

**The startTransition wrapping is the critical factor.** Transitions are lower priority than SyncLane. In both dev and prod:

- `queue.reset()` -> `useSyncExternalStore` fires at **SyncLane** (immediate)
- `history.replaceState` -> Next.js dispatches via **startTransition** (deferred)

But in **dev mode**, the double render from StrictMode means the SyncLane update takes longer to process (two render passes instead of one), giving the transition even less time to be batched. The SyncLane update commits the intermediate "no queued value + old searchParams" state before the transition resolves.

In **production**, the single render pass at SyncLane is fast enough that by the time React's microtask processing completes, the transition from `startTransition` has also been enqueued and can be processed in rapid succession, making the intermediate state invisible (zero frames at the intermediate state).

#### nuqs's Own History Patching

nuqs adds its own layer on top via `onHistoryStateUpdate`:

```javascript
function onHistoryStateUpdate() {
  spinQueueResetMutex(() => {
    queueMicrotask(resetQueues)
  })
}
```

The `queueMicrotask(resetQueues)` delays the queue reset to after the current render work, specifically to avoid "useInsertionEffect cannot schedule updates" errors from Next.js's internal `useInsertionEffect`. This `queueMicrotask` timing adds another scheduling layer that interacts differently with StrictMode's double execution.

## Key Takeaways

- **The bug is primarily caused by React StrictMode**, not by a fundamentally different scheduler. StrictMode's double-render and double-effect-fire increase the time window during which intermediate store states are observable.

- **useSyncExternalStore updates are intentionally non-batchable** with transition updates. This is a design decision by the React team to prevent tearing, but it means `queue.reset()` commits before `useSearchParams` catches up.

- **The priority inversion is the root cause**: `queue.reset()` forces a SyncLane (highest priority) update, while `history.replaceState` triggers a transition (lower priority) update for `useSearchParams`. In dev mode, the extra rendering overhead widens the gap.

- **Next.js's Suspense behavior differs between dev and prod**: In dev, `useSearchParams` doesn't suspend, which changes the component lifecycle and can affect when the search params value becomes available.

- **The fix should likely avoid the intermediate "empty queue" state being observable**: Either by not clearing the queue until `useSearchParams` has caught up, or by keeping the queued value until the URL confirms it, or by resetting the queue synchronously before `history.replaceState` rather than after.

## Open Questions & Limitations

1. **Exact microtask ordering**: The precise interleaving of `queueMicrotask(resetQueues)` with React's internal scheduling in dev vs prod could not be fully determined from public sources alone. The observable difference may come down to a single microtask checkpoint being present in dev (from StrictMode overhead) that doesn't exist in prod.

2. **React 19 changes**: React 19 may have changed some of these behaviors. The analysis above is based on React 18.x source code. If the project uses React 19, the compiler and new rendering pipeline could affect timing.

3. **Next.js version specifics**: The history patching mechanism has changed across Next.js versions (14.1.0 made useSearchParams reactive to shallow updates). The exact version in use may affect timing.

4. **Turbopack vs Webpack**: Next.js dev mode timing may differ between Turbopack and Webpack bundlers, though this is unlikely to affect React scheduling directly.

## Sources

1. [React StrictMode documentation](https://react.dev/reference/react/StrictMode) - Official docs on double-invoke behavior
2. [useSyncExternalStore documentation](https://react.dev/reference/react/useSyncExternalStore) - Official API reference with caveats
3. [React source: ReactFiberHooks.new.js (v18.2.0)](https://github.com/facebook/react/blob/v18.2.0/packages/react-reconciler/src/ReactFiberHooks.new.js) - Source code for mountSyncExternalStore, updateSyncExternalStore, forceStoreRerender
4. [React issue #25191](https://github.com/facebook/react/issues/25191) - useSyncExternalStore batching/flushing behavior discussion
5. [React issue #24831](https://github.com/facebook/react/issues/24831) - useSyncExternalStore batching with setTimeout
6. [React issue #27266](https://github.com/facebook/react/issues/27266) - StrictMode double render with useSyncExternalStore
7. [React WG Discussion #86](https://github.com/reactwg/react-18/discussions/86) - useMutableSource to useSyncExternalStore migration
8. [React WG Discussion #96](https://github.com/reactwg/react-18/discussions/96) - StrictMode double rendering update
9. [How useSyncExternalStore works internally](https://jser.dev/2023-08-02-usesyncexternalstore/) - Deep dive into React internals
10. [Next.js app-router.tsx source](https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/app-router.tsx) - History patching implementation
11. [Next.js useSearchParams docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) - Dev vs prod Suspense differences
12. [React issue #24502](https://github.com/facebook/react/issues/24502) - useEffect runs twice in StrictMode
13. [React issue #25565](https://github.com/facebook/react/issues/25565) - useSyncExternalStore interaction with setState
14. [React WG Discussion #21](https://github.com/reactwg/react-18/discussions/21) - Automatic batching in React 18
15. [React useSyncExternalStore RFC](https://github.com/reactjs/rfcs/blob/main/text/0214-use-sync-external-store.md) - Original RFC with design rationale
16. [Next.js Fast Refresh architecture](https://nextjs.org/docs/architecture/fast-refresh) - Dev-only HMR behavior
