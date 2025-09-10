# AGENTS GUIDE

Operational instructions for autonomous coding / AI agents contributing to this repository.

Refer to: [README.md](README.md) & [CONTRIBUTING.md](CONTRIBUTING.md) for authoritative detail.

---

## 1. Repository Structure (Monorepo)

- Library source: `packages/nuqs`
- Documentation app (Next.js + Fumadocs): `packages/docs`
  - MDX content: `packages/docs/content`
- End-to-end test benches: `packages/e2e`
  - Framework targets: Next.js app/pages, React SPA, Remix, TanStack Router, React Router v6/v7
- Examples: `packages/examples/*`
- This guide: `AGENTS.md`
- Contributing guidelines: `CONTRIBUTING.md`

---

## 2. Core Concepts (nuqs)

- Goal: Type-safe URL query string <-> React state sync.
- Hooks:
  - `useQueryState(key, parserOrConfig)`
  - `useQueryStates(configObject, options)`
- Parsers provide: `parse`, `serialize`; may be enhanced with builder helpers:
  - `.withDefault(value)`
  - `.withOptions({ history, shallow, limitUrlUpdates, startTransition })`
- Builder creation for custom types: `createParser({ parse, serialize, eq })`
- Batch + throttle: multiple `setState` calls in one tick are merged; URL updates throttled (≥50ms unless overridden).
- Promise return value of state setter resolves when URL update flushes; cache per batch.

Principles:

1. URL = single source of truth.
2. Serialization & deserialization must be lossless & pure functions.
3. Defaults are internal (not written to URL).
4. Invalid parse => return `null` or throw an error.

---

## 3. Server-Side Utilities

- Loader: `createLoader(parsers[, { urlKeys }])` for one-off parsing.
- Cache: `createSearchParamsCache(parsers)` for nested Server Components (Next.js app router).
- Serializer: `createSerializer(parsers[, { urlKeys }])` for canonical URLs / links.
- Import server helpers from `'nuqs/server'` (avoids the `"use client"` directive).

---

## 4. Adapters (Mandatory)

Wrap app root with the appropriate adapter:

- Next.js app router: `nuqs/adapters/next/app`
- Next.js pages router: `nuqs/adapters/next/pages`
- React SPA: `nuqs/adapters/react`
- Remix: `nuqs/adapters/remix`
- React Router v6: `nuqs/adapters/react-router/v6`
- React Router v7: `nuqs/adapters/react-router/v7`
- TanStack Router: `nuqs/adapters/tanstack-router`
- Testing: `nuqs/adapters/testing`

When adding a new framework adapter:

1. Mirror existing adapter API surface.
2. Provide minimal feature parity: read/query, push/replace history, batching.
3. Add e2e bench under `packages/e2e/<framework>`.
4. Document in README Adapters section + docs content page.
5. Add test coverage (unit + e2e).

---

## 5. Options Semantics

- `history`: `'replace'` (default) or `'push'`
- `shallow` (Next.js only): default true (client-first). Set false to trigger RSC / SSR invalidation.
- `throttleMs`: ≥50ms (ignored if lower). Only URL & server notification are throttled, not in-memory state.
- `startTransition`: pass from `React.useTransition` when using `shallow: false` for loading states.

Override per-update via second argument to setter: `setValue(v, { history, shallow, throttleMs })`.

---

## 6. Performance & Reliability

- Maintain batch queue integrity: merging updates per key while preserving final state.
- Avoid adding synchronous expensive operations inside parse/serialize; keep pure & fast.
- Ensure no memory leaks (listeners removed on unmount).
- Keep serialization deterministic (stable ordering when using multiple keys).

---

## 7. Testing Strategy

Run full suite: `pnpm test` (build + unit + typing + e2e). It takes 5-10 minutes: do not time out.
Unit test hooks with `NuqsTestingAdapter`.
Type-level testing: in `packages/nuqs/tests/*.test-d.ts` => add type tests when updating type definitions
API testing: check exported symbols in `packages/nuqs/src/api.test.ts` => update when exporting new symbols
End-to-end tests for adapter-related behaviors and changes.

For regression:

1. Reproduce with failing test first (preferred).
2. Fix; ensure types remain stable.
3. Add scenario to appropriate e2e bench if framework-specific.

---

## 8. Documentation Updates

When changing:

- Public API surface
- Parser behaviors
- Adapter requirements

Update both:

- [README.md](README.md)
- MDX docs under `packages/docs/content` (mirror relevant sections)

Add examples that are concise; prefer linking to existing demos rather than duplicating code.

---

## 9. Release Process

- Conventional Commits required (enforced by review):
  - `feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `chore:` etc.
  - Breaking changes: `feat!:` _and_ footer `BREAKING CHANGE:`
- `semantic-release` drives versioning & NPM publish from `next` branch.
- Do not manually bump versions.

---

## 10. Safe Change Guidelines

Before modifying core logic in `packages/nuqs`:

1. Assess API surface impact (type exports, builder chaining).
2. Maintain backward compatibility unless intentional breaking change with justification.
3. Provide migration notes (if breaking) in PR body.
4. Validate types with `pnpm test --filter nuqs` (includes TS type tests).

Do not:

- Introduce side effects in module top-level (affects tree shaking).
- Use non-standard browser APIs without guards.
- Increase bundle size significantly (keep zero dependencies).

---

## 11. Adding a New Parser

Checklist:

1. Implement `parse(query: string): T | null`
2. Implement `serialize(value: T): string`
3. Wrap with `createParser` to inherit chaining.
4. Ensure bijectivity: `parse(serialize(v))` yields equivalent value. Use the `isParserBijective` helper.
5. Add unit tests (valid, invalid, round-trip).
6. Update README Parsing section + docs.
7. Consider server import path support (works identically when imported from `'nuqs/server'`).

---

## 12. SEO Guidance

If search params are UI-local only: supply canonical URL without them.
If search params define content identity: include them via `createSerializer`.
Document specialized patterns (YouTube-like ID mapping) minimally.

---

## 13. Debugging

Enable debug logs:

```js
localStorage.setItem('debug', 'nuqs')
```

Prefixes:

- `[nuqs]` single-key
- `[nuq+]` multi-key

Encourage debug logs in issue reports.

---

## 14. Agent Task Patterns

Common tasks & required steps:

| Task                    | Required Actions                                                  |
| ----------------------- | ----------------------------------------------------------------- |
| Fix parse bug           | Add failing test, patch parser, update docs if behavior clarified |
| Add adapter             | Follow section 4 steps, update README + docs, add e2e bench       |
| Add parser              | Follow section 11                                                 |
| Improve performance     | Benchmark before/after (include optional script or measurements)  |
| Update docs only        | Ensure no code changes; run docs build                            |
| Add feature flag/option | Justify; default must preserve current behavior; document clearly |
| Refactor internal code  | Preserve public API & types; add tests covering changed flows     |

---

## 15. PR Quality Checklist (Automatable)

- [ ] `pnpm run test` passes
- [ ] Tests added/updated
- [ ] All new exports documented
- [ ] Docs content updated if applicable
- [ ] README updated if user-facing
- [ ] No unintended bundle size growth
- [ ] Conventional Commit message

---

## 16. Anti-Patterns (Avoid)

- Throwing in parsers for invalid input (return `null` instead, smaller bundle size impact)
- Writing default values into URL
- Lossy or impure serialization / deserialization
- Introducing blocking async behavior in parse/serialize
- Duplicating logic across adapters (prefer shared utility)

---

## 17. Minimal Architectural Notes

Flow:

1. Hook reads initial value from current `window.location.search`.
2. Local React state mirrors parsed value.
3. Setter enqueues mutation intent (key -> serialized value | delete).
4. Batch flush (throttled) applies merged changes to History API (push/replace).
5. Promise resolves with updated `URLSearchParams`.
6. If `shallow: false`: uses the router APIs to trigger server-side rendering / data fetching.

Server utilities replicate parse logic without requiring the client hooks.

---

## 18. Extensibility Guidelines

When extending:

- Prefer composition (wrapping parser) over modifying core hook.
- Add generic utilities under an internal helpers module if reused ≥2 places.
- Keep adapter interfaces thin (translate framework navigation to common history operations).

---

## 19. Security & Validation

Parsers do not validate semantic constraints. If you add validation helpers:

- Keep them opt-in.
- Avoid coupling to heavy schema libs; document integration (e.g., Zod) externally,
  prefer using Standard Schema v1.

---

## 20. Issue Reproduction Script Template (For Agents)

Provide minimal component:

```tsx
import { useQueryState, parseAsInteger } from 'nuqs'
export function Repro() {
  const [count, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0)
  )
  return <button onClick={() => setCount(c => c + 1)}>count {count}</button>
}
```

Include:

- Initial URL
- Steps
- Observed vs expected
- Debug log snippet (if relevant)

---

## 21. Decision Log (Lightweight)

Add a short note here when making non-trivial architectural changes:
Format:
`YYYY-MM-DD - <Title> - Rationale / Impact / Migration (if any)`

(Empty initially)

---

## 22. Automation Suggestions

Agents may:

- Generate parser boilerplate
- Update Adapters section block
- Append PR checklist results
- Run local tests & lint before proposing changes

Never auto-commit version bumps (handled by release automation).

---

## 23. Quick Commands

```bash
pnpm install        # deps
pnpm dev --filter package-name... # start dev process on the given package and its dependencies
pnpm build          # build library (tsup)
pnpm test           # full test pipeline
```

---

## 24. Exit Conditions for Agent Tasks

A task is DONE when:

- All checklist items satisfied
- Tests pass locally
- Docs consistent with behavior
- No unresolved TODOs introduced
- No stray console logs added (except controlled debug supports)
