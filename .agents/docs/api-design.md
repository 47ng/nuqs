# API Design & Architecture

Guide for maintaining API stability, designing extensions, and understanding the architecture.

## Core Architecture

### Flow

1. **Initialization:** Hook reads initial value from current `window.location.search`
2. **Local State:** React state mirrors parsed value
3. **Mutation Enqueue:** Setter enqueues mutation intent (key → serialized value | delete)
4. **Batch & Throttle:** Multiple `setState` calls in one tick are merged
5. **Flush to URL:** Batch flush (throttled ≥50ms) applies merged changes to History API (push/replace)
6. **Promise Resolution:** Returns when URL update flushes; cache per batch
7. **Server Trigger:** If `shallow: false`, uses router APIs to trigger server-side rendering / data fetching

### Batch Queue Integrity

- **Key merging:** Updates for the same key within one tick are coalesced (final state wins)
- **Final value preservation:** Last write for each key determines the output
- **No reordering:** Order of keys in URL is stable

## Design Principles

### 1. URL as Single Source of Truth

- URL shape defines state shape
- Parsing must be deterministic
- Serialization must be lossless

### 2. Type Safety

- Hooks return typed values matching parser output
- Builder chaining preserves types
- Type exports are part of public API

### 3. Zero Dependencies & Bundle Size

- No external dependencies
- Avoid side effects in module top-level (affects tree shaking)
- Keep parse/serialize fast and lightweight
- Throwing in parsers has bundle cost (return `null` instead)

### 4. Backward Compatibility

Before modifying core logic in `packages/nuqs`:

1. **Assess API surface impact**
   - Type exports
   - Builder chaining
   - Hook signatures

2. **Maintain backward compatibility** unless intentional breaking change
   - Breaking changes require justification
   - Provide migration notes in PR body

3. **Validate types** with `pnpm test --filter nuqs` (includes TS type tests)

## Performance & Reliability

### Batch Efficiency

- Merging updates per key while preserving final state
- Single URL write per flush cycle
- No synchronous expensive operations inside parse/serialize

### Memory Management

- Ensure no memory leaks
- Remove listeners on unmount
- Clear event handler references

### URL Determinism

- Keep serialization deterministic
- Use stable ordering for multiple keys
- Consistent formatting

## Extensibility Guidelines

When extending nuqs:

### Composition Over Modification

- Prefer wrapping parsers over modifying core hook
- Create adapters for new frameworks instead of baking support in core
- Use builder pattern for optional behaviors

### Code Organization

- Add generic utilities under internal helpers module if reused ≥2 places
- Keep adapter interfaces thin
- Translate framework navigation to common history operations

### Builder Pattern

- Use `.withDefault()` for defaults
- Use `.withOptions()` for behavior customization
- Keep chaining lightweight

## Safety Checklist for Core Changes

Do not:

- Introduce side effects in module top-level (tree shaking impact)
- Use non-standard browser APIs without guards
- Increase bundle size significantly (maintain zero dependencies)
- Export internal implementation details
- Break existing type signatures

Do:

- Test types with type-level tests (`.test-d.ts`)
- Provide type exports alongside implementation
- Document API changes in README
- Validate with full test suite
