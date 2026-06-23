import { BreakingChangeMarker } from '@/src/components/changelog/breaking-change-marker'
import { ChangeDescription } from '@/src/components/changelog/change-description'
import { GitHubProfile } from '@/src/components/github-profile'
import { cn, github } from '@/src/lib/utils'
import type { ComponentProps } from 'react'

export type PullRequestLineProps = Omit<ComponentProps<'li'>, 'children'> & {
  prNumber: number
  description: string
  author: string | null
  breaking: boolean
}

// Presentational, fetch-free changelog line for a squashed-PR change. Every
// value is derived statically from the DTO — the PR link from its number, the
// title from the raw `description` (code spans rendered via the shared
// span-parser, identical to the GitHub notes), the author from `GitHubProfile`
// (avatar from `github.com/{login}.png`, no API call). Distinct from the
// self-fetching `ui/pr-line` still used by the blog: the changelog page makes
// zero GitHub API calls.
export function PullRequestLine({
  prNumber,
  description,
  author,
  breaking,
  className,
  ...props
}: PullRequestLineProps) {
  return (
    <li className={cn('not-prose space-x-2', className)} {...props}>
      {breaking && <BreakingChangeMarker />}
      <a
        href={`https://github.com/${github.owner}/${github.repo}/pull/${prNumber}`}
        className="group space-x-1.5"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-sm text-blue-500 tabular-nums sm:text-base">
          <span aria-label="number">#</span>
          {prNumber}
        </span>
        <span className="text-muted-foreground">·</span>
        <ChangeDescription description={description} />
      </a>
      {author && (
        <>
          <span className="text-muted-foreground" role="presentation">
            ·
          </span>
          <span className="sr-only">by </span>
          <GitHubProfile handle={author} />
        </>
      )}
    </li>
  )
}
