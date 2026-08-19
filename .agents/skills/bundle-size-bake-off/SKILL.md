---
name: bundle-size-bake-off
description: Run a "bake-off" to reduce the bundle size impact of changes using subagents
metadata:
  author: François Best <francoisbest.com>
---

Spin up a number of subagents (as told by the user or 4 by default) to find an implementation
that yields a smaller bundle size for the current PR, branch or changes we're working on.

## Tools

To measure the bundle size: `pnpm build --filter nuqs && pnpm run --filter nuqs test:size`

1. Always build first using the root command to leverage Turbo caching
2. `pnpm run --filter nuqs test:size` will print the size on stdout. `pnpm run --filter nuqs build:size-json` will write it to a packages/nuqs/size.json file. Both will fail if the size is over the limit.

## Process

The main metric we want to reduce is the Client bundle size (minified & brotli-compressed).

size-limit does all the processing and gives out a metric, no other build steps are needed: this is a trial and error process.

You (the main agent) are not to do this work yourself: delegate it to N subagents. Each subagent works in its own worktree (setup with `pnpm setup:worktree`), with the following instructions:

1. Start by measuring the baseline bundle size before making changes
2. Reason about and refactor scoped pieces of code (renaming things, organising logic, merging & splitting functions)
3. Measure the bundle size again
4. If the changes are over the baseline, restore it and start over.
   Otherwise, keep going for a few rounds based on the changes complexity.

Try both small incremental steps and larger changes. Sometimes moving back and trying something else will give a better result (use a gradient descent approach, avoid local minima).

Note: some changes will play better with compression than others
(sometimes, duplication will give better results than abstractions due to dictionaries).

## Validation criteria:

The changes must:

- Be logic-identical to the baseline (no change in behaviour)
- Not touch the public API of the package (no renaming exported symbols)
- Be scoped to the PR, branch or local changes we're working on in this session, unless explicitly asked for a package-wide bake-off
- Remain legible and maintainable by humans
- Yield a bundle size strictly under the baseline and the limits set in size-limit (whichever is smallest)
- Pass all tests (unit for quick iteration, then an e2e pass if relevant)

Any violation is a failure condition, and that candidate is to be dismissed.

## Completion

Once subagents have reported their findings, give the user a short report:

- Table of diffs against baseline
- For each candidate, a one-liner explainer (ASD-STE100 Simplified Technical English) of how it achieved that result (what it touched)
- Score and sort the candidates by most reduction first

Example:

```txt
| Name                          | Client  | Tree-shaken | Server  |
| ----------------------------- | ------: | ----------: | ------: |
| Baseline                      | 5,920 B │     4,288 B │ 3,786 B │
| 1. Inline parser helpers      |  -308 B |      -112 B |   -32 B |
| 2. Split shared state helpers |  -240 B |       -64 B |   -16 B |
| 3. Remove wrapper functions   |  -128 B |       -32 B |    +2 B |

What they did:
1. removes call layers from the client path.
2. keeps server-only code out of the client bundle.
3. lets the bundler inline small calls.
```

Once the user has accepted the changes, fold the accepted candidate into your own worktree, and clear the subagent worktrees & branches.
