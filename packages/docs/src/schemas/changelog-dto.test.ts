import { readFileSync } from 'node:fs'
import { changelogJsonSchema } from 'scripts/lib/changelog-dto'
import { describe, expect, it } from 'vitest'
import { CHANGELOG_SCHEMA_ARTIFACT_PATH } from './changelog-dto.artifact.ts'

describe('changelog DTO JSON Schema artifact', () => {
  // Drift guard: the committed artifact must equal what the Zod SSOT generates
  // right now. Any schema change not re-exported (via `pnpm --filter docs
  // gen:schema`) fails here, so the published schema can never silently
  // disagree with the codec that serializes and parses the DTO.
  it('matches the schema generated from the Zod SSOT', () => {
    const committed: unknown = JSON.parse(
      readFileSync(CHANGELOG_SCHEMA_ARTIFACT_PATH, 'utf8')
    )
    expect(changelogJsonSchema()).toEqual(committed)
  })
})
