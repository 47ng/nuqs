# AGENTS GUIDE

Operational instructions for autonomous coding / AI agents contributing to the nuqs repository.

**nuqs** is a library for type-safe URL query string ↔ React state synchronization with minimal bundle size and zero dependencies.

Refer to: [README.md](README.md) & [CONTRIBUTING.md](CONTRIBUTING.md) for authoritative detail.

---

## Essential Context

### Repository Structure (Monorepo)

- **Library source:** `packages/nuqs`
- **Documentation app** (Next.js + Fumadocs): `packages/docs`
  - MDX content: `packages/docs/content`
- **End-to-end test benches:** `packages/e2e`
  - Framework targets: Next.js app/pages, React SPA, Remix, TanStack Router, React Router v6/v7
- **Examples:** `packages/examples/*`

### Core Concepts (nuqs)

- **Goal:** Type-safe URL query string ↔ React state sync.
- **Main Hooks:**
  - `useQueryState(key, parserOrConfig)`
  - `useQueryStates(configObject, options)`
- **Parsers:** Provide `parse` & `serialize`; enhanced with `.withDefault()` & `.withOptions()`
- **Batching & Throttling:** Multiple state updates in one tick are merged; URL updates throttled (≥50ms)
- **Key Principles:**
  1. URL = single source of truth
  2. Serialization must be lossless & pure
  3. Defaults are internal (not written to URL)
  4. Invalid parse → return `null`

### Configuration

- **Package manager:** `pnpm`
- **Build:** `pnpm build`
- **Test suite:** `pnpm test` (5-10 minutes; includes build + unit + typing + e2e)
- **Development:** `pnpm dev --filter <package-name>...` (triple dots start dependencies' dev script too)

---

## Development Guidelines

For detailed development guidelines organized by task, see:

- **[Adapter Development](.agents/docs/adapter-development.md)** — Adding framework adapters
- **[Parser Implementation](.agents/docs/parser-implementation.md)** — Creating custom parsers
- **[API Design & Architecture](.agents/docs/api-design.md)** — Design principles, extensibility, type safety
- **[Testing Patterns](.agents/docs/testing.md)** — Unit, type-level, and e2e testing strategies
- **[Release & Git Workflow](.agents/docs/git-workflow.md)** — Conventional commits, semantic versioning, PR standards
- **[Quality Standards](.agents/docs/quality-standards.md)** — Checklists, performance, security, anti-patterns

---

## Quick Reference: Common Tasks

| Task                    | Guide                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| Fix a bug               | See [Testing Patterns](.agents/docs/testing.md) → Regression                      |
| Add a new parser        | See [Parser Implementation](.agents/docs/parser-implementation.md)                |
| Add a framework adapter | See [Adapter Development](.agents/docs/adapter-development.md)                    |
| Improve performance     | See [API Design](.agents/docs/api-design.md) → Performance & Reliability          |
| Update documentation    | See [Release & Git Workflow](.agents/docs/git-workflow.md) → Documentation        |
| Prepare a pull request  | See [Release & Git Workflow](.agents/docs/git-workflow.md) → PR Quality Checklist |

---

## Debugging

Enable debug logs in the browser console:

```js
localStorage.setItem('debug', 'nuqs')
```

Log prefixes:

- `[nuqs]` — single-key operations
- `[nuq+]` — multi-key operations

Encourage debug logs in issue reports and include them in reproduction scripts.

---

## Exit Conditions for Agent Tasks

A task is **DONE** when:

- All checklist items satisfied
- Tests pass locally (`pnpm test`)
- Docs consistent with behavior
- No unresolved TODOs introduced
- No stray console logs (except controlled debug support)
