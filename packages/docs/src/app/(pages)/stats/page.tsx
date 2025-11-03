import { SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import {
  NPMDownloads,
  NPMDownloadsSkeleton,
  NPMStats,
  NPMStatsSkeleton
} from './_components/downloads'
import { StarHistoryGraph, StarHistoryGraphSkeleton } from './_components/stars'
import { Versions } from './_components/versions'
import { Widget } from './_components/widget'
import { WidgetSkeleton } from './_components/widget.skeleton'
import { getVersions, sumVersions } from './lib/versions'
import { loadSearchParams } from './searchParams'

type StatsPageProps = {
  searchParams: Promise<SearchParams>
}

export default async function StatsPage({ searchParams }: StatsPageProps) {
  return (
    <div className="mx-auto max-w-[88rem] px-4">
      <h1 className="sr-only">Project Stats</h1>
      <section className="my-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<StarHistoryGraphSkeleton />}>
          <StarHistoryGraph />
        </Suspense>
        <Widget className="flex h-auto flex-col gap-2">
          <img
            width={814}
            height={318}
            alt="Project analytics and stats"
            src="https://repobeats.axiom.co/api/embed/3ee740e4729dce3992bfa8c74645cfebad8ba034.svg"
          />
          <div className="flex flex-1 items-center gap-6 p-4">
            <Suspense fallback={<NPMStatsSkeleton />}>
              <NPMStats />
            </Suspense>
          </div>
        </Widget>
        <Suspense fallback={<NPMDownloadsSkeleton />}>
          <NPMDownloads />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <VersionsLoader searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  )
}

// --

type VersionsLoaderProps = {
  searchParams: Promise<SearchParams>
}

async function VersionsLoader({ searchParams }: VersionsLoaderProps) {
  const { pkg, beta } = await loadSearchParams(searchParams)
  const allVersions = await getVersions(beta)
  const pkgVersions = pkg === 'both' ? sumVersions(allVersions) : allVersions
  // @ts-expect-error
  const versionsToShow = Object.entries(pkgVersions.at(-1)?.[pkg] ?? {})
    .slice(0, 5)
    .map(([key, _]) => key)
  return (
    <Suspense
      fallback={<div className="animate-pulse text-center">Loading...</div>}
    >
      <Versions
        records={pkgVersions.map(v => ({
          date: v.date,
          // @ts-ignore
          ...v[pkg]
        }))}
        versions={versionsToShow}
      />
    </Suspense>
  )
}
