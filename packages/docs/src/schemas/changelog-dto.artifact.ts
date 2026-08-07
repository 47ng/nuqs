import { fileURLToPath } from 'node:url'
import { CHANGELOG_DTO_SCHEMA_URL } from 'scripts/lib/changelog-dto'

// Absolute path of the committed JSON Schema artifact, shared by the generator
// that writes it and the drift test that guards it so the two can't disagree
// about where it lives. It is served as a static file at its own `$schema` URL:
// Next serves `public/` at the site root, so the URL pathname maps 1:1 to a
// file under `public/`. Deriving the path from the URL ties the served file,
// the generator, and the test together — change the URL and the path follows.
export const CHANGELOG_SCHEMA_ARTIFACT_PATH = fileURLToPath(
  new URL(
    `../../public${new URL(CHANGELOG_DTO_SCHEMA_URL).pathname}`,
    import.meta.url
  )
)
