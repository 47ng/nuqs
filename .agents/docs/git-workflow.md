# Release & Git Workflow

Guide for versioning, commits, pull requests, and release process.

## Conventional Commits

All commits follow the Conventional Commits specification. This is enforced by review.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- **`feat:`** New feature
- **`fix:`** Bug fix
- **`perf:`** Performance improvement
- **`docs:`** Documentation only
- **`refactor:`** Code restructuring (no feature change)
- **`test:`** Test addition or update
- **`chore:`** Tooling, dependencies, config

### Breaking Changes

For breaking changes:

1. Use `feat!:` or `fix!:` prefix
2. Add footer: `BREAKING CHANGE: <description>`

Example:

```
feat!: change parser return type

BREAKING CHANGE: parseAsInteger now throws on invalid input instead of returning null
```

## Semantic Versioning

Version bumping is **automated by `semantic-release`**:

- **Patch** (v1.2.3 → v1.2.4) — `fix:` commits
- **Minor** (v1.2.0 → v1.3.0) — `feat:` commits
- **Major** (v1.0.0 → v2.0.0) — `feat!:` or `fix!:` (breaking changes)

**Do not manually bump versions** — The automation handles this.

## Release Branch

- **Release branch:** `next`
- Commits to `next` trigger `semantic-release`
- Publishing to NPM is automatic
- Check [GitHub Releases](../../releases) for version history

## Pull Request Standards

### Before Opening a PR

1. Ensure commit messages follow Conventional Commits
2. Run local tests: `pnpm test`
3. Verify types with type-level tests
4. Update documentation if applicable
5. Consider if breaking change justification is needed

### PR Description

Include:

- **Summary** — What is this PR doing and why?
- **Type** — Is this a feature, fix, refactor, or doc update?
- **Changes** — High-level list of modified areas
- **Testing** — What test coverage was added?
- **Breaking Changes** — If applicable, describe migration path

### PR Title

PR title should match the first commit message (Conventional Commit format):

- `feat: add new parser type`
- `fix: handle edge case in batching`
- `docs: update adapter setup guide`

### PR Checklist

Before marking ready for review:

- [ ] `pnpm test` passes locally
- [ ] Tests added/updated for new behavior
- [ ] All new exports documented
- [ ] Docs content updated if applicable
- [ ] README updated if user-facing change
- [ ] No unintended bundle size growth
- [ ] Conventional Commit message
- [ ] No unresolved TODOs introduced
- [ ] No stray console logs (except controlled debug)

## Documentation Updates

Update documentation when:

- **Public API surface changes** (new exports, hook signature)
- **Parser behavior changes** (parsing rules, serialization)
- **Adapter requirements change** (new options, breaking changes)

### What to Update

1. **README.md**
   - Examples section
   - API reference
   - Adapter list

2. **MDX docs** under `packages/docs/content`
   - Mirror relevant README sections
   - Add detailed examples
   - Document configuration options

### Documentation Best Practices

- Keep examples concise
- Link to existing demos instead of duplicating code
- Maintain consistency with existing documentation style
- Add examples that show common use cases
- Update table of contents if adding new sections

## Decision Log

When making non-trivial architectural changes:

1. Add a short note to AGENTS.md Decision Log section
2. Format: `YYYY-MM-DD - <Title> - Rationale / Impact / Migration (if any)`
3. Examples:
   - `2025-01-15 - Add batching optimization - Reduces URL updates by 40% when multiple state changes occur in same tick. No migration needed.`
   - `2025-01-20 - Parser requires eq method - Enables custom equality checks for complex types. Existing parsers automatically compatible.`

## Automation & Tools

The team uses the following automation:

- **Conventional Commits:** Enforced by commit linting
- **Type checking:** Part of `pnpm test`
- **semantic-release:** Automatic versioning and publishing from `next` branch
- **PR checks:** Linting, testing, type checking run automatically

**Agents may:**

- Generate parser boilerplate
- Update Adapters section in documentation
- Append PR checklist results
- Run local tests & lint before proposing changes

**Agents must not:**

- Auto-commit version bumps (handled by release automation)
- Force push to main/master
- Modify git configuration
- Skip git hooks
