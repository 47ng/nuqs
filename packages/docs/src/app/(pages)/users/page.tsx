import { Description, H1 } from '@/src/components/typography'
import { cn } from '@/src/lib/utils'
import { Star } from 'lucide-react'
import { type Metadata } from 'next'
import { Suspense } from 'react'
import { type Dependent, fetchDependents } from '../_landing/dependents'
import { formatNumber } from '../stats/lib/format'

export const metadata = {
  title: 'Users',
  description: 'A list of popular projects that use nuqs.'
} satisfies Metadata

export default function UsersPage() {
  return (
    <main className="container py-8">
      <header className="prose mb-8">
        <H1>{metadata.title}</H1>
        <Description>{metadata.description}</Description>
      </header>
      <Suspense>
        <UsersList />
      </Suspense>
    </main>
  )
}

async function UsersList() {
  const dependents = await fetchDependents()
  return (
    <ol className="list-decimal space-y-2 pl-8">
      {dependents.map(dependent => (
        <li key={dependent.owner + dependent.name}>
          <LeaderboardItem dependent={dependent} />
        </li>
      ))}
    </ol>
  )
}

// --

type LeaderboardItemProps = {
  dependent: Dependent
}

function LeaderboardItem({ dependent }: LeaderboardItemProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className={cn(
          'h-4 w-1 translate-px rounded-sm',
          dependent.pkg === 'nuqs' ? 'bg-green-500/25' : 'bg-amber-500'
        )}
        aria-label={`uses ${dependent.pkg}`}
      />
      <img
        src={dependent.avatarURL}
        alt={dependent.owner + '/' + dependent.name}
        className="inline-block h-6 w-6 flex-0 rounded-full"
      />
      <span>
        <a
          href={`https://github.com/${dependent.owner}`}
          className="text-muted-foreground hover:underline"
        >
          {dependent.owner}
        </a>
        <span className="text-zinc-500">{' / '}</span>
        <a
          href={`https://github.com/${dependent.owner}/${dependent.name}`}
          className="hover:underline"
        >
          {dependent.name}
        </a>
      </span>
      <div className="ml-auto flex items-center gap-4">
        {dependent.version && (
          <span className="font-mono text-xs text-zinc-500">
            {dependent.version}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm text-gray-500">
          {formatNumber(dependent.stars)} <Star size={12} />
        </span>
      </div>
    </div>
  )
}
