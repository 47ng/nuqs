import { cn } from '@/src/lib/utils'

// Name at most this many contributors before collapsing the rest into an
// "N other contributors" tail.
const MAX_NAMED_CONTRIBUTORS = 3

// Show at most this many overlapping avatars before a "+N" bubble; avatars are a
// denser surface than the named summary, so this cap is higher.
const MAX_AVATARS = 8

// Needs en-US for the Oxford comma, seriously??
const formatter = new Intl.ListFormat('en-US', { type: 'conjunction' })

// Build the human-readable contributors summary purely from GitHub logins (no
// API call). Lists everyone when the count is small, otherwise names the first
// few and collapses the rest as "a, b, c, and 4 other contributors".
export function formatContributorsSummary(
  contributors: readonly string[]
): string | null {
  if (contributors.length === 0) return null
  // Collapsing is only worth it past a single hidden name — "and 1 other
  // contributor" reads longer than just naming them.
  if (contributors.length <= MAX_NAMED_CONTRIBUTORS + 1) {
    return formatter.format(contributors)
  }
  const named = contributors.slice(0, MAX_NAMED_CONTRIBUTORS)
  const others = contributors.length - MAX_NAMED_CONTRIBUTORS
  return formatter.format([...named, `${others} other contributors`])
}

export type ContributorsFooterProps = {
  contributors: readonly string[]
}

// Per-release contributors credit: a GitHub-style row of overlapping avatars
// (linking to each profile) plus an `Intl.ListFormat` summary, built entirely
// from the DTO's `contributors` logins — zero GitHub API calls (avatars come
// straight from `github.com/{login}.png`). Renders nothing when the release
// credits no one.
export function ContributorsFooter({ contributors }: ContributorsFooterProps) {
  const summary = formatContributorsSummary(contributors)
  if (summary === null) return null
  const shown = contributors.slice(0, MAX_AVATARS)
  const overflow = contributors.length - shown.length
  return (
    <footer className="not-prose mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <ul className="flex items-center pl-0">
        {shown.map((login, index) => (
          // Key by index too to handle hand-edited non-unique logins
          // (not enforced by the DTO schema)
          <li
            key={`${login}-${index}`}
            className={cn('list-none', index > 0 && '-ml-2')}
          >
            <a
              href={`https://github.com/${login}`}
              target="_blank"
              rel="noopener noreferrer"
              title={login}
            >
              <img
                src={`https://github.com/${login}.png`}
                alt={`${login}'s GitHub profile`}
                width={24}
                height={24}
                loading="lazy"
                className="ring-fd-background block size-6 rounded-full ring-2"
              />
            </a>
          </li>
        ))}
        {overflow > 0 && (
          <li className="-ml-2 list-none">
            <span className="ring-fd-background bg-fd-muted text-fd-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium ring-2">
              +{overflow}
            </span>
          </li>
        )}
      </ul>
      <p className="text-md">{summary}</p>
    </footer>
  )
}
