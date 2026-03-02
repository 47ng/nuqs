# Adapter Development

Guide for adding framework adapters to nuqs.

## Overview

Adapters wrap the app root and provide the minimal translation layer between nuqs and framework routing APIs.

- **Next.js app router:** `nuqs/adapters/next/app`
- **Next.js pages router:** `nuqs/adapters/next/pages`
- **React SPA:** `nuqs/adapters/react`
- **Remix:** `nuqs/adapters/remix`
- **React Router v6:** `nuqs/adapters/react-router/v6`
- **React Router v7:** `nuqs/adapters/react-router/v7`
- **TanStack Router:** `nuqs/adapters/tanstack-router`
- **Testing:** `nuqs/adapters/testing`

## Adding a New Framework Adapter

### Checklist

1. **Mirror existing adapter API surface**
   - Ensure the exported provider component matches established patterns
   - Use consistent naming and parameter shapes

2. **Implement minimal feature parity**
   - Read/query: Parse current search params
   - Push/replace history: Update URL without full reload
   - Batching: Support merging multiple updates per tick

3. **Create e2e bench**
   - Add test application under `packages/e2e/<framework>`
   - Cover both App Router and Pages Router if applicable

4. **Documentation**
   - Update README Adapters section
   - Add docs content page explaining adapter setup

5. **Test coverage**
   - Unit tests for adapter integration
   - E2E tests for framework-specific behaviors

### Key Requirements

- Adapter must support `shallow` option semantics (when applicable to framework)
- Handle history `push` vs `replace` operations correctly
- Ensure batch queue integrity (updates per key merged while preserving final state)
- No memory leaks (listeners removed on unmount)

### Server-Side Utilities

When adding adapter support, consider server utilities:

- **Loader:** `createLoader(parsers[, { urlKeys }])` for one-off parsing
- **Cache:** `createSearchParamsCache(parsers)` for nested Server Components (Next.js app router)
- **Serializer:** `createSerializer(parsers[, { urlKeys }])` for canonical URLs / links
- Import server helpers from `'nuqs/server'` (avoids the `"use client"` directive)

These should work identically across adapters where applicable.

## Options Semantics

When implementing adapter support:

- **`history`:** `'replace'` (default) or `'push'`
- **`shallow`** (Next.js only): Default true (client-first). Set false to trigger RSC / SSR invalidation
- **`throttleMs`:** ≥50ms (ignored if lower). Only URL & server notification are throttled, not in-memory state
- **`startTransition`:** Pass from `React.useTransition` when using `shallow: false` for loading states

Override per-update via second argument to setter: `setValue(v, { history, shallow, throttleMs })`

## Architectural Flow

1. Hook reads initial value from current `window.location.search`
2. Local React state mirrors parsed value
3. Setter enqueues mutation intent (key → serialized value | delete)
4. Batch flush (throttled) applies merged changes to History API (push/replace)
5. Promise resolves with updated `URLSearchParams`
6. If `shallow: false`: uses router APIs to trigger server-side rendering / data fetching

## Extensibility

- Prefer composition (wrapping adapter) over modifying core adapter
- Keep adapter interfaces thin (translate framework navigation to common history operations)
- Avoid duplicating logic across adapters (prefer shared utility)
