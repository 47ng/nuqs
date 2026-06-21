# Quality Standards

Guide for performance, security, reliability, and quality assurance.

## Exit Conditions for Agent Tasks

A task is **DONE** when all of the following are satisfied:

- [ ] All checklist items satisfied
- [ ] Tests pass locally (`pnpm test`)
- [ ] Docs consistent with behavior
- [ ] No unresolved TODOs introduced
- [ ] No stray console logs (except controlled debug support)

## Performance Guidelines

### Bundle Size Constraints

- **Maintain zero dependencies** — Core library has no external deps
- **Avoid side effects in module top-level** — Affects tree shaking
- **Keep parse/serialize fast** — Called synchronously on every URL change
- **Avoid expensive operations** inside hooks (memoize if needed)

### Measuring Performance

For performance improvements:

1. Benchmark before/after
2. Include measurement methodology in PR
3. Document impact quantitatively
4. Validate with full test suite

### Batch Efficiency

- Merging updates per key preserves final state
- Single URL write per flush cycle (≥50ms throttle)
- No blocking operations during flush
- Listeners cleaned up on unmount (no leaks)

## Reliability Guidelines

### Memory Management

- **Remove listeners on unmount** — Prevents memory leaks
- **Clear event handler references** — Especially in cleanup phases
- **No circular references** — Between components and parsers
- **Test cleanup** — Verify unmounted components don't cause errors

### URL Determinism

- **Stable serialization** — Same input always produces same output
- **Consistent ordering** — Multiple keys serialize in predictable order
- **Deterministic parsing** — No randomness or side effects
- **Lossless round-trip** — `parse(serialize(v)) ≈ v` for all valid values

### Error Handling

When something goes wrong:

- **Parser invalid input:** Return `null`, not throw
  - Smaller bundle impact
  - Graceful degradation
  - Easier composition

- **Invalid state recovery:** Fall back to defaults gracefully
- **Type safety:** Prevent invalid states at type level

## Security Practices

### Parser Validation

Parsers are primarily **type converters**, not validators:

- Keep validation opt-in
- Avoid coupling to heavy validation libraries
- Document external integrations (Zod, Standard Schema v1)

### No User Input Injection

- Parse all URL params defensively
- Validate types before using
- Never interpolate user input into code/templates

### Safe Browser API Usage

- Guard non-standard browser APIs
- Check for availability before use
- Fallback to safe alternatives

## Anti-Patterns to Avoid

### In Parsers

- ❌ **Throwing for invalid input** — Return `null` instead
- ❌ **Lossy serialization** — Must preserve all information
- ❌ **Impure functions** — Same input must produce same output
- ❌ **Blocking async behavior** — No Promise-based parsing
- ❌ **Non-deterministic output** — Breaks URL length and caching

### In Hooks

- ❌ **Side effects in render** — Use useEffect properly
- ❌ **Synchronous expensive operations** — Defer to useCallback/useMemo
- ❌ **Memory leaks on unmount** — Always clean up
- ❌ **Infinite update loops** — Verify batch and throttle mechanics

### In Adapters

- ❌ **Duplicating logic across adapters** — Prefer shared utilities
- ❌ **Tight coupling to framework internals** — Use public APIs
- ❌ **Breaking API compatibility** — Keep surfaces aligned
- ❌ **Missing batch/throttle support** — Essential for all adapters

### In Core Library

- ❌ **Side effects in module top-level** — Breaks tree shaking
- ❌ **Non-standard browser APIs** — Without guards
- ❌ **Significant bundle growth** — Monitor size in PRs
- ❌ **Exporting internal implementation** — Only public interfaces

## Code Quality Checklist

For any change:

- [ ] Type-safe throughout
- [ ] Tests added or updated
- [ ] No console.log/debugger statements
- [ ] No dead code
- [ ] No duplicate logic
- [ ] Comments explain "why", not "what"
- [ ] Function names are clear
- [ ] Error messages are helpful

## Documentation Quality

For user-facing changes:

- [ ] README updated with examples
- [ ] API changes documented with types
- [ ] Migration guide (if breaking change)
- [ ] Examples runnable and up-to-date
- [ ] No typos or grammatical errors
- [ ] Consistent with existing docs style

## Type Safety

- [ ] All exports have explicit types
- [ ] Generic constraints are clear
- [ ] No `any` types unless justified
- [ ] Type tests included (`.test-d.ts`)
- [ ] Types match behavior
- [ ] Return types are specific (not `unknown`)

## Common Issues to Check

### Import Paths

- Verify relative imports resolve correctly
- Check that exports work from both CJS and ESM
- Ensure server utilities available from `'nuqs/server'`

### Framework Adapters

- Verify history API usage matches framework
- Check batch/throttle behavior aligns with core
- Test in actual framework (not just testing adapter)

### Type Coverage

- Run type tests: `pnpm test --filter nuqs`
- Verify exported types in `api.test.ts`
- Check builder chaining preserves types

## Debugging Checklist

Enable debug logs when investigating:

```js
localStorage.setItem('debug', 'nuqs')
```

Use prefixes:

- `[nuqs]` — Single-key hook operations
- `[nuq+]` — Multi-key hook operations

Capture debug output for:

- Issue reports
- Performance analysis
- State synchronization problems
