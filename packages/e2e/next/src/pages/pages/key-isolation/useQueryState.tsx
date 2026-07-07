import { KeyIsolationUseQueryState } from 'e2e-shared/specs/key-isolation'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

// Hoisted to module scope: the pages router re-renders the page tree top-down
// on every route state change; a render-stable element lets React bail out,
// confining RouterContext re-renders to the adapter's bridge
// (see the experimental_keyIsolation prop docs).
const content = (
  <NuqsAdapter experimental_keyIsolation>
    <KeyIsolationUseQueryState />
  </NuqsAdapter>
)

export default function Page() {
  return content
}
