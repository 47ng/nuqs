import { Star } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { connection } from 'next/server'
import { getStarHistory } from '../lib/github'
import { GraphSkeleton } from './graph.skeleton'
import { StarsGraph } from './stars.client'
import StargazersList from './stars.gazers-list'
import { Widget } from './widget'
import { WidgetSkeleton } from './widget.skeleton'

const getCachedStarHistory = unstable_cache(
  getStarHistory,
  ['github-star-history'],
  { revalidate: 5 * 60 }
)

export async function StarHistoryGraph() {
  await connection()
  const stars = await getCachedStarHistory()
  if (stars === null) {
    return (
      <Widget
        title={
          <>
            <Star size={20} className="ml-2" /> Stars
          </>
        }
      >
        <p className="text-muted-foreground flex h-74.5 items-center justify-center text-sm">
          Star history is unavailable: set GITHUB_TOKEN to enable it.
        </p>
      </Widget>
    )
  }
  return (
    <StarsGraph data={stars} stargazersTab={<StargazersList stars={stars} />} />
  )
}

export function StarHistoryGraphSkeleton() {
  return (
    <WidgetSkeleton
      title={
        <div className="flex w-full items-center gap-2 pb-1">
          <Star size={20} />
          <div className="bg-muted h-5 w-16 animate-pulse rounded-md" />
          <div className="bg-muted ml-auto h-9 w-50 animate-pulse rounded-md" />
        </div>
      }
    >
      <GraphSkeleton className="h-74.5 pt-2" />
    </WidgetSkeleton>
  )
}
