#! /usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { styleText } from 'node:util'
import { changelogJsonSchema } from 'scripts/lib/changelog-dto'
import { CHANGELOG_SCHEMA_ARTIFACT_PATH } from './changelog-dto.artifact.ts'

// Regenerate the committed JSON Schema artifact from the Zod SSOT. Throwaway by
// design: run by hand only when the changelog DTO schema changes
// (`pnpm --filter docs gen:schema`). The drift test fails the build until it is
// re-run, so the published schema and the codec can never silently diverge.

await mkdir(dirname(CHANGELOG_SCHEMA_ARTIFACT_PATH), { recursive: true })
await writeFile(
  CHANGELOG_SCHEMA_ARTIFACT_PATH,
  JSON.stringify(changelogJsonSchema(), null, 2) + '\n'
)

console.log(styleText('green', `Wrote ${CHANGELOG_SCHEMA_ARTIFACT_PATH}`))
