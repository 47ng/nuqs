import { type Activity } from '@/src/components/kibo-ui/contribution-graph'
import { Suspense } from 'react'
import {
  fetchGitHubReleases,
  processReleases
} from './release-contribution-graph.lib'
import { ReleaseContributionGraphClient } from './release-contribution-graph.client'

// Compile-time guard: the lib's local `Activity` must stay shape-equivalent to
// the kibo-ui one it ultimately feeds, regardless of how the JSX wiring evolves.
// Resolves to `never` (failing assignment below) if either side drifts.
type LibActivity = ReturnType<typeof processReleases>['activities'][number]
type ShapeEqual<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : never
  : never
const _activityInSync: ShapeEqual<LibActivity, Activity> = true

function ReleaseContributionGraphSkeleton() {
  return (
    <div className="flex w-full max-w-[686px] flex-col gap-2">
      <div className="bg-muted h-[108px] animate-pulse rounded" />
      <div className="flex h-7 items-center justify-between">
        <div className="bg-muted h-4.5 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4.5 w-44 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function ReleaseContributionGraph({
  year
}: ReleaseContributionGraphProps) {
  return (
    <div className="my-12 flex flex-col items-center justify-center">
      <Suspense fallback={<ReleaseContributionGraphSkeleton />}>
        <ReleaseContributionGraphLoader year={year} />
      </Suspense>
    </div>
  )
}

// --

type ReleaseContributionGraphProps = {
  year: number
}

async function ReleaseContributionGraphLoader({
  year
}: ReleaseContributionGraphProps) {
  const releases = await fetchGitHubReleases()
  const { activities, releasesByDate } = processReleases(releases, year)
  const stableCount = activities.filter(a => a.level === 2).length
  const betaCount = activities.filter(a => a.level === 1).length

  return (
    <ReleaseContributionGraphClient
      activities={activities}
      releasesByDate={releasesByDate}
      stableCount={stableCount}
      betaCount={betaCount}
    />
  )
}
