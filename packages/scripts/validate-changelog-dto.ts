#!/usr/bin/env node

// Exit 0 iff the release body on $RELEASE_BODY carries a changelog DTO that
// parses through the shared codec (a well-formed, schema-valid `<changelog:dto>`
// comment); exit 1 otherwise. This is `parseChangelogComment` — the very parse a
// renderer runs — exposed as a process gate, so a caller that renders *only* the
// parsed DTO can tell, before doing expensive work, whether a body would render
// at all (a body with no valid DTO degrades to a bare entry, or renders nothing
// new). Running the same codec keeps this gate from drifting from the renderer.
//
// The body is read from the environment, never an argument, so a `-->`-laden or
// otherwise hostile body is only ever data to a pure parser, never shell input.

import { parseChangelogComment } from './lib/changelog-dto.ts'

if (parseChangelogComment(process.env.RELEASE_BODY ?? null) === null) {
  console.error('No valid changelog DTO found in the release body.')
  process.exit(1)
}
console.log('Release body carries a valid changelog DTO.')
