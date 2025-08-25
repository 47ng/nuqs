import { cn } from '@/src/lib/utils'
import { formatStatNumber } from '../lib/format'
import type { GitHubStarHistory } from '../lib/github'

type StargazersListProps = {
  stars: GitHubStarHistory
}

export default function StargazersList({ stars }: StargazersListProps) {
  const stargarzers = stars.bins.flatMap(b => b.stargarzers)
  return (
    <ul className="mt-1 max-h-83 overflow-y-auto overscroll-contain px-1">
      {stargarzers.map(s => (
        <li
          key={s.login + s.avatarUrl}
          className="flex flex-wrap gap-2 py-2 text-sm not-last:border-b"
        >
          <a
            href={`https://github.com/${s.login}`}
            className="group flex items-center gap-2"
          >
            <img
              src={s.avatarUrl}
              alt={s.name ?? 'Unknown'}
              className="h-5 w-5 rounded-full"
            />
            <span className="text-foreground font-semibold empty:hidden">
              {s.name}
            </span>
            <span className="text-sm text-zinc-500 group-hover:underline">
              {s.login}
            </span>
          </a>
          <span className="ml-auto flex items-center gap-2 text-zinc-500">
            <span className="font-semibold empty:hidden">{s.company}</span>
            <span
              className={cn(
                s.followers > 100 && 'text-blue-600 dark:text-blue-400/80',
                s.followers > 500 && 'text-green-600 dark:text-green-400/70'
              )}
            >
              {formatStatNumber(s.followers)} follower{s.followers > 1 && 's'}
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
