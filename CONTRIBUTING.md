# Contribution Guidelines

First off, thanks for your help!

## Getting started

1. Fork and clone the repository
2. Install dependencies with `yarn install`
3. Start the development environment with `yarn dev`

## Project structure

This repository contains a combination of several things:

- The source code for the `next-usequerystate` NPM package, in [`src/lib`](./src/lib).
- A Next.js app that serves as:
  - A playground deployed at <https://next-usequerystate.vercel.app>
  - A host for [end-to-end tests](./cypress//e2e) driven by Cypress
- Typings tests using [`tsd`](https://github.com/SamVerschueren/tsd), in [`./src/tests/**.test-d.ts`](./src/tests/)

When running `next dev`, this will:

- Start the Next.js app and the playground will be available at <http://localhost:3000>.
- Build the library and watch for changes using [`tsup`](https://tsup.egoist.dev/)

## Proposing changes

This repository uses [`semantic-release`](https://semantic-release.gitbook.io/semantic-release/)
to automatically publish new versions of the package to NPM.
To do this, the Git history follows the
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
