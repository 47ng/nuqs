# Parser Implementation

Guide for creating custom parsers and understanding parser semantics.

## Overview

Parsers are the bridge between URL strings and typed state. Each parser provides bidirectional conversion.

## Creating a Custom Parser

### Core Interface

A parser has two methods:

- **`parse(query: string): T | null`** — Deserialize from URL string
- **`serialize(value: T): string`** — Serialize to URL string

Optionally:

- **`eq`** — Custom equality check (defaults to `===`)

### Implementation Checklist

1. **Implement `parse(query: string): T | null`**
   - Return `null` for invalid input (not throwing; smaller bundle impact)
   - Keep the function pure and fast

2. **Implement `serialize(value: T): string`**
   - Must be deterministic (stable output for same input)
   - Pure function, no side effects

3. **Wrap with `createParser`**
   - Enables chaining with `.withDefault()` and `.withOptions()`
   - Example: `export const parseAsInteger = createParser({ parse, serialize, eq })`

4. **Validate bijectivity**
   - Ensure `parse(serialize(v))` yields an equivalent value
   - Use the `isParserBijective` helper to verify
   - Round-trip tests are essential

5. **Add unit tests**
   - Valid inputs
   - Invalid inputs
   - Round-trip verification
   - Edge cases specific to your type

6. **Update documentation**
   - README Parsing section
   - MDX docs under `packages/docs/content`

7. **Consider server import path support**
   - Works identically when imported from `'nuqs/server'`
   - Use standard library functions only (no DOM APIs)

## Parser Design Principles

### Serialization Rules

- **Lossless:** Must preserve all information needed for valid round-trips
- **Pure:** Same input always produces same output
- **Deterministic:** Stable ordering when using multiple keys
- **No side effects:** Keep async operations out of parse/serialize

### Error Handling

- **Invalid parse:** Return `null`, not throw
  - Reduces bundle size impact
  - Allows graceful degradation
  - Simpler composition

- **Validation is optional:** Parsers do not validate semantic constraints
  - If you add validation helpers, keep them opt-in
  - Avoid coupling to heavy schema libs
  - Document integrations (e.g., Zod) externally

### Performance Considerations

- Keep parse/serialize as lightweight as possible
- Avoid expensive operations in these functions
- Remember they run synchronously on URL changes

## Builder Methods

### `.withDefault(value)`

Provides an internal default value. The default is **not written to the URL**.

```ts
const parser = parseAsInteger.withDefault(0)
// URL: ?count=    (empty or absent)
// State: 0        (from default)
```

### `.withOptions({ history, shallow, limitUrlUpdates, startTransition })`

Configure behavior options:

- **`history`:** `'push'` or `'replace'` (default)
- **`shallow`:** Trigger SSR/RSC invalidation (Next.js)
- **`limitUrlUpdates`:** Optional function to debounce updates
- **`startTransition`:** Pass from `useTransition` for loading states

## Anti-Patterns

Avoid:

- **Throwing for invalid input** — Return `null` instead
- **Lossy serialization** — Must preserve all information
- **Impure functions** — Same input must produce same output
- **Blocking async behavior** — No Promise-based parsing
- **Non-deterministic ordering** — Matters for URL length and caching

## Security & Validation

Parsers are primarily **type converters**, not validators. If you need validation:

- Keep validation helpers opt-in
- Document recommended external libraries (e.g., Zod, Standard Schema v1)
- Prefer composition over coupling to schema libraries

## Examples

See the parser test suite and README for concrete examples:

- `parseAsInteger` — Basic number parsing
- `parseAsString` — String identity
- `parseAsArrayOf()` — Generic array parsing
- Custom parsers in documentation
