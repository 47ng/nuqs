import { cn } from '@/src/lib/utils'
import { formatDate, formatStatNumber } from '../lib/format'
import type { GitHubStarHistory } from '../lib/github'

type Stargazer = GitHubStarHistory['bins'][number]['stargarzers'][number]

type StargazersListProps = {
  stars: GitHubStarHistory
}

export default function StargazersList({ stars }: StargazersListProps) {
  return (
    <ul className="max-h-84 overflow-y-auto overscroll-contain">
      {stars.bins.map(bin => (
        <section key={bin.date} className="relative not-first:pt-4">
          <h3 className="text-muted-foreground bg-background sticky top-0 border-b px-3 py-2 text-xs leading-tight font-semibold uppercase">
            {formatDate(bin.date, '', {
              weekday: 'long',
              day: '2-digit',
              month: 'long'
            })}
          </h3>
          {bin.stargarzers.map(stargazer => (
            <Stargazer
              data={stargazer}
              key={stargazer.login + stargazer.avatarUrl}
            />
          ))}
        </section>
      ))}
    </ul>
  )
}

type StargazerProps = {
  data: Stargazer
}

function Stargazer({
  data: { login, name, avatarUrl, company, followers }
}: StargazerProps) {
  return (
    <li className="border-border/50 flex flex-wrap gap-2 px-3 py-2 text-sm not-last:border-b">
      <a
        href={`https://github.com/${login}`}
        className="group flex items-center gap-2"
      >
        <img
          src={avatarUrl}
          alt={name ?? 'Unknown'}
          className="h-5 w-5 rounded-full"
        />
        <span className="text-foreground font-semibold empty:hidden">
          {name}
        </span>
        <span className="text-sm text-zinc-500 group-hover:underline">
          {login}
        </span>
      </a>
      <span className="ml-auto flex items-center gap-2 text-zinc-500">
        <span className="font-semibold empty:hidden">{company}</span>
        <span
          className={cn(
            followers > 100 && 'text-blue-600 dark:text-blue-400/80',
            followers > 500 && 'text-green-600 dark:text-green-400/70'
          )}
        >
          {formatStatNumber(followers)} follower{followers > 1 && 's'}
        </span>
      </span>
    </li>
  )
}
