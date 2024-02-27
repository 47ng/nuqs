import { Card } from '@tremor/react'
import Image from 'next/image'
import { Suspense } from 'react'
import { NPMDownloads, NPMStats } from './_components/downloads'
import { StarHistoryGraph } from './_components/stars'
import { Versions } from './_components/versions'
import { getVersions } from './lib/versions'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const versions = await getVersions()
  const versionsToShow = Object.entries(
    versions.filter(v => v.package === 'nuqs').at(-1)?.relative ?? {}
  )
    .slice(0, 5)
    .map(([key, _]) => key)
  const widgetSkeleton = (
    <div className="min-h-[16rem] w-full animate-pulse rounded border" />
  )
  return (
    <main className="container px-2 py-2 sm:px-4 md:py-4">
      <h1 className="sr-only">Project Stats</h1>
      <section className="my-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={widgetSkeleton}>
          <StarHistoryGraph />
        </Suspense>
        <Card className="flex flex-col gap-2 p-2 dark:bg-background">
          <Image
            width={814}
            height={318}
            alt="Project analytics and stats"
            src="https://repobeats.axiom.co/api/embed/3ee740e4729dce3992bfa8c74645cfebad8ba034.svg"
          />
          <div className="flex min-h-24 flex-1 items-center gap-6 px-4">
            <Suspense>
              <NPMStats />
            </Suspense>
          </div>
        </Card>
        <Suspense>
          <NPMDownloads />
        </Suspense>
        <Suspense fallback={widgetSkeleton}>
          <Versions
            records={versions
              .filter(v => v.package === 'nuqs')
              .map(v => ({
                date: v.date,
                ...v.downloads
              }))}
            versions={versionsToShow}
          />
        </Suspense>
      </section>
    </main>
  )
}
