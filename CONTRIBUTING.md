# Contribution Guidelines

First off, thanks for your help!

## Getting started

1. Fork and clone the repository
2. Install dependencies with `pnpm install`
3. Start the development environment with `pnpm dev`

## Project structure

This monorepo contains:

- The source code for the `nuqs` NPM package, in [`packages/nuqs`](./packages/nuqs).
- A Next.js app under [`packages/docs`](./packages/docs) that serves the documentation and as a playground deployed at <https://nuqs.47ng.com>
- A test bench for [end-to-end tests](./packages/e2e) for each supported framework, driven by Cypress

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

You can run the complete integration test suite with `pnpm test`.

It will build the library, run unit tests and typing tests against it, and then
run the end-to-end tests against the test bench Next.js app (which uses the built library).

When proposing changes or showcasing a bug, adding a minimal reproduction in the
playground can be very helpful.

## Opening issues

Please follow the [issue template](.github/ISSUE_TEMPLATE/bug_report.md) when opening a new issue.

A minimal reproduction example is very helpful to understand the issue and
inspect it locally.

## Proposing changes

This repository uses [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)
to automatically publish new versions of the package to NPM.
To do this, the Git history follows the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
