import { Description, H1 } from '@/src/components/typography'
import { Star } from 'lucide-react'
import { type Metadata } from 'next'
import { Suspense } from 'react'
import { fetchDependents } from '../_landing/dependents'

export const metadata = {
  title: 'Users',
  description: 'A list of popular projects that use nuqs.'
} satisfies Metadata

export default function UsersPage() {
  return (
    <main className="container py-8">
      <H1>{metadata.title}</H1>
      <Description className="mb-8">{metadata.description}</Description>
      <Suspense>
        <UsersList />
      </Suspense>
    </main>
  )
}

async function UsersList() {
  const repos = await fetchDependents()
  return (
    <ul className="space-y-2">
      {repos.map(repo => (
        <li key={repo.owner + repo.name} className="flex items-center gap-4">
          <span className="border-background inline-block h-2.5 w-2.5 rounded-full border-2">
            <span
              className={`block h-2 w-2 rounded-full ${
                repo.pkg === 'nuqs' ? 'bg-green-500' : 'bg-zinc-500'
              }`}
            />
          </span>
          <img
            src={repo.avatarURL}
            alt={repo.owner + '/' + repo.name}
            className="inline-block h-6 w-6 rounded-full"
          />
          <span>
            <a
              href={`https://github.com/${repo.owner}`}
              className="hover:underline"
            >
              {repo.owner}
            </a>
            <span className="text-zinc-500">{' / '}</span>
            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              className="hover:underline"
            >
              {repo.name}
            </a>
          </span>
          <div className="ml-auto flex items-center gap-4">
            {repo.version && (
              <span className="font-mono text-xs text-zinc-500">
                {repo.version}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-gray-500">
              {repo.stars} <Star size={12} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
