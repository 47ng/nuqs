import { cn } from '@/src/lib/utils'
import {
  GitMerge,
  GitPullRequestArrow,
  GitPullRequestClosed,
  GitPullRequestDraft,
  type LucideIcon
} from 'lucide-react'
import { z } from 'zod/v4'

export type PullRequestLineProps = {
  number: number | string
}

const pullRequestSchema = z.object({
  title: z.string(),
  state: z.enum(['open', 'closed', 'merged']),
  draft: z.boolean(),
  merged: z.boolean(),
  html_url: z.url(),
  user: z.object({
    login: z.string(),
    avatar_url: z.url()
  })
})

type Status = 'open' | 'closed' | 'merged' | 'draft'

const statusColors: Record<Status, string> = {
  open: 'text-green-600 dark:text-green-400',
  closed: 'text-red-500 dark:text-red-400',
  merged: 'text-purple-600 dark:text-purple-400',
  draft: 'text-gray-600 dark:text-gray-400'
}

const statusIcons: Record<Status, LucideIcon> = {
  open: GitPullRequestArrow,
  closed: GitPullRequestClosed,
  merged: GitMerge,
  draft: GitPullRequestDraft
}

export async function PullRequestLine({ number }: PullRequestLineProps) {
  const response = await fetch(
    `https://api.github.com/repos/47ng/nuqs/pulls/${number}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`
      }
    }
  )
  if (!response.ok) {
    return (
      <li className="flex items-baseline gap-1">
        <span className="tabular-nums">#{number}</span>
        <span className="font-semibold text-gray-500">
          Failed to fetch details: {response.status} {response.statusText}
        </span>
      </li>
    )
  }
  const data = pullRequestSchema.parse(await response.json())

  const status: Status = data.merged
    ? 'merged'
    : data.draft
      ? 'draft'
      : data.state === 'open'
        ? 'open'
        : 'closed'
  const StatusIcon = statusIcons[status]

  // Clean up conventional commit prefixes, including scopes
  const title = data.title
    .replace(
      /^(feat|fix|doc[s]?|style|refactor|perf|test|chore|ci)(\(\w+\))?:\s*/i,
      ''
    )
    .trim()
  return (
    <li className="not-prose space-x-2">
      <a
        href={data.html_url}
        className="group space-x-1.5"
        target="_blank"
        rel="noopener noreferrer"
      >
        <StatusIcon
          className={cn('hidden self-center sm:inline', statusColors[status])}
          aria-label={`${status} PR`}
          size={16}
        />
        <span className="text-sm text-gray-500 tabular-nums sm:text-base sm:font-medium">
          <span aria-label="number">#</span>
          {number}
        </span>
        <span className="font-medium group-hover:underline">{title}</span>
      </a>
      <a
        href={`https://github.com/${data.user.login}`}
        className="text-sm whitespace-nowrap text-gray-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={data.user.avatar_url}
          alt={`${data.user.login}'s avatar`}
          role="presentation"
          className="inline size-5 rounded-full"
        />{' '}
        <span className="sr-only">by</span>
        {data.user.login}
      </a>
    </li>
  )
}
