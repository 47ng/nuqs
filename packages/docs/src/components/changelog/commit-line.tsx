import { cn, github } from '@/src/lib/utils'
import type { ComponentProps } from 'react'
import { parseCodeSpans } from 'scripts/lib/changelog-dto'

export type CommitLineProps = Omit<ComponentProps<'li'>, 'children'> & {
  sha: string
  description: string
  author: string
}

// Presentational, fetch-free changelog line for a direct-commit change (a commit
// landed with no PR — a hotfix or revert). The counterpart to `PullRequestLine`:
// the commit link is derived from its SHA, the title from the raw `description`
// (code spans via the shared span-parser, identical to the GitHub notes), and the
// author is the git author *name* rendered as plain text — not a GitHub login, so
// no avatar and no profile link (unlike a squashed PR's `GitHubProfile`). Renders
// the direct commits that the old markdown-reparsing page silently dropped.
export function CommitLine({
  sha,
  description,
  author,
  className,
  ...props
}: CommitLineProps) {
  return (
    <li className={cn('not-prose space-x-2', className)} {...props}>
      <a
        href={`https://github.com/${github.owner}/${github.repo}/commit/${sha}`}
        className="group space-x-1.5"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="font-mono text-sm text-gray-500 sm:text-base sm:font-medium">
          {sha}
        </span>
        <span className="font-medium group-hover:underline">
          {parseCodeSpans(description).map((segment, index) =>
            segment.code ? (
              <code key={index}>{segment.value}</code>
            ) : (
              <span key={index}>{segment.value}</span>
            )
          )}
        </span>
      </a>{' '}
      <span className="text-sm whitespace-nowrap text-gray-500">
        <span className="sr-only">by</span> {author}
      </span>
    </li>
  )
}
