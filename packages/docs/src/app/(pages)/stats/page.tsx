import { Suspense } from 'react'

import dynamicImport from 'next/dynamic'
import { StarHistoryGraph } from './_components/star-history-graph'
import { getVersions } from './lib/versions'

const VersionAdoptionGraph = dynamicImport(
  () => import('./_components/version-adoption'),
  { ssr: false }
)

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const versions = await getVersions()
  const widgetSkeleton = (
    <div className="min-h-[16rem] w-full animate-pulse rounded border" />
  )
  return (
    <main className="container py-2 md:py-4">
      <h1 className="text-2xl font-bold md:text-4xl">Project Stats</h1>
      <section className="my-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Suspense fallback={widgetSkeleton}>
          <StarHistoryGraph />
        </Suspense>
        <Suspense fallback={widgetSkeleton}>
          <VersionAdoptionGraph records={versions} />
        </Suspense>
        <img
          alt="Project analytics and stats"
          src="https://repobeats.axiom.co/api/embed/3ee740e4729dce3992bfa8c74645cfebad8ba034.svg"
          className="mx-auto"
        />
        {widgetSkeleton}
      </section>
    </main>
  )
}
