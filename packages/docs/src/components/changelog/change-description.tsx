import { parseCodeSpans } from 'scripts/lib/changelog-dto'

// A change title rendered from its raw `description`: inline-code spans become
// <code>, everything else plain text — via the shared span-parser, so the page
// and the GitHub notes render the description identically. Shared by the PR and
// direct-commit changelog lines.
export function ChangeDescription({ description }: { description: string }) {
  return (
    <span className="font-medium group-hover:underline">
      {parseCodeSpans(description).map((segment, index) =>
        segment.code ? (
          <code key={index}>{segment.value}</code>
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </span>
  )
}
