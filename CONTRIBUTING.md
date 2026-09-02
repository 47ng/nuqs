# Contribution Guidelines

First off, thanks for your help! 🙏

## Getting started

1. Fork and clone the repository
2. Set up the checkout with `node --run setup:worktree`
3. Start the development environment with `pnpm dev --filter <package-name>...`

## Git hooks (optional)

This repo ships [Git config-based hooks](.gitconfig) (requires Git 2.54+) that
run the same lint checks as CI locally — Prettier and Sherif on `git commit`,
Commitlint on the message, and the full lint suite on `git push`. They catch CI
failures before you open a PR.

They are **opt-in** and not installed automatically. To enable them in your
clone, run once:

```sh
node --run setup:hooks
```

This also enables a fingerprinted `post-checkout` bootstrap for linked
worktrees. If the current Node version cannot run package scripts yet, invoke
the setup directly with `node packages/scripts/worktree-setup.mjs` after
activating `.node-version`.

The checkout hook only auto-installs dependencies for branches whose
dependency manifests match `origin/HEAD`. When it skips, review the branch,
then run `node --run setup:worktree` — explicit setup executes the branch's
code.

## Project structure

This monorepo contains:

- The source code for the `nuqs` NPM package, in [`packages/nuqs`](./packages/nuqs).
- A Next.js app under [`packages/docs`](./packages/docs) that serves the documentation and as a playground deployed at <https://nuqs.dev>. Copy [`packages/docs/.env.example`](./packages/docs/.env.example) to `.env.local` for the optional env vars local docs dev can use.
- Test benches for [end-to-end tests](./packages/e2e) for each supported framework, driven by Playwright
- Examples of integration with other tools.

When running `pnpm dev`, this will:

- Build the library and watch for changes using [`tsdown`](https://tsdown.dev)
- Start the docs app, which will be available at <http://localhost:3000>.
- Start the end-to-end test benches:
  - http://localhost:3001 - [Next.js](./packages/e2e/next)
  - http://localhost:3002 - [React SPA](./packages/e2e/react)
  - http://localhost:3003 - [Remix](./packages/e2e/remix)
  - http://localhost:3004 - [TanStack Router](./packages/e2e/tanstack-router)
  - http://localhost:3005 - [React Router v5](./packages/e2e/react-router/v5)
  - http://localhost:3006 - [React Router v6](./packages/e2e/react-router/v6)
  - http://localhost:3007 - [React Router v7](./packages/e2e/react-router/v7)
  - http://localhost:3008 - [React Router v8](./packages/e2e/react-router/v8)
- Start the examples:
  - http://localhost:4000 - [tRPC](./packages/examples/trpc)
  - http://localhost:4001 - [Next.js - App router](./packages/examples/next-app)

Since this will start a lot of processes, you may want to run `pnpm dev --filter <package-name>...`
to only start the packages you are working on (eg: `pnpm dev --filter docs...`).
The triple dots `...` will also start any dependencies of the package you specify.

## Testing

You can run the complete integration test suite with `pnpm test` from the root of the repository.

It will build the library, run unit tests and typing tests against it, and then
run the end-to-end tests against the test bench apps (which uses the built library).

When proposing changes or fixing a bug, adding tests (unit or in the
appropriate e2e test environment) can help tremendously to validate and
understand the changes.

For a focused test run, filter the root Turbo command, for example:

- `pnpm run test --filter nuqs`
- `pnpm run test --filter e2e-next`

Turbo builds each selected task's dependencies before testing them. Avoid
calling package-level test scripts directly, as that bypasses the task graph.

Mutation testing is available separately because it is too slow for the regular
test suite:

```sh
pnpm mutation
```

The report is written to `packages/nuqs/reports/mutation/`. The `Mutation debt`
check fails when a change increases the number of undetected mutants relative to
its base. When mutation inputs change, CI runs the complete candidate suite and
compares its aggregate debt with a fresh report from the exact base commit.

## Opening issues

Please follow the [issue template](.github/ISSUE_TEMPLATE/bug_report.md) when opening a new issue.

A minimal reproduction example is very helpful to understand the issue and
inspect it locally.

## Proposing changes

Make sure your changes:

1. Pass the tests: `pnpm test`
2. Pass linting checks: `pnpm lint`
3. Have relevant documentation additions / updates (in the `packages/docs/content` and the README.md file).

This repository uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for commit messages. Any bumping keywords (fix, feat, perf, etc) should be reserved to changes
in the `nuqs` package itself (enforced in CI).
For example, fixes in the docs are named `doc: fix <whatever>`.

Pull requests should target the `next` branch.

If your changes impact the `nuqs` package, you'll get a comment from [pkg.pr.new](https://pkg.pr.new)
with a preview deployment of the package you can install in your application.

If you are proposing a bug fix, pushing a failing test first (with a note in the
PR description) is very helpful in showcasing the issue and validating the fix in
a follow-up commit (test-driven development).
