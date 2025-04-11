# Contribution Guidelines

First off, thanks for your help! 🙏

## Getting started

1. Fork and clone the repository
2. Install dependencies with `pnpm install`
3. Start the development environment with `pnpm dev`

## Project structure

This monorepo contains:

- The source code for the `nuqs` NPM package, in [`packages/nuqs`](./packages/nuqs).
- A Next.js app under [`packages/docs`](./packages/docs) that serves the documentation and as a playground deployed at <https://nuqs.47ng.com>
- Test benches for [end-to-end tests](./packages/e2e) for each supported framework, driven by Cypress

When running `next dev`, this will:

- Build the library and watch for changes using [`tsup`](https://tsup.egoist.dev/)
- Start the docs app, which will be available at <http://localhost:3000>.
- Start the end-to-end test benches:
  - http://localhost:3001 - Next.js
  - http://localhost:3002 - React SPA
  - http://localhost:3003 - Remix
  - http://localhost:3006 - React Router v6
  - http://localhost:3007 - React Router v7

## Testing

You can run the complete integration test suite with `pnpm test` from the root of the repository.

It will build the library, run unit tests and typing tests against it, and then
run the end-to-end tests against the test bench apps (which uses the built library).

When proposing changes or fixing a bug, adding tests (unit or in the
appropriate e2e test environment) can help tremendously to validate and
understand the changes.

## Opening issues

Please follow the [issue template](.github/ISSUE_TEMPLATE/bug_report.md) when opening a new issue.

A minimal reproduction example is very helpful to understand the issue and
inspect it locally.

## Proposing changes

Make sure your changes:

1. Pass the tests: `pnpm test`
2. Pass linting checks: `pnpm lint`
3. Have relevant documentation additions / updates (in the `packages/docs/content` and the README.md file).

This repository uses [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)
to automatically publish new versions of the package to NPM.
To do this, the Git history follows the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

Pull requests should target the `next` branch.

If your changes impact the `nuqs` package, you'll get a comment from [pkg.pr.new](https://pkg.pr.new)
with a preview deployment of the package you can install in your application.

If you are proposing a bug fix, pushing a failing test first (with a note in the
PR description) is very helpful in showcasing the issue and validating the fix in
a follow-up commit (test-driven development).
