import { Download } from 'lucide-react'
import { Suspense } from 'react'
import { formatStatNumber } from '../lib/format'
import { combineStats, fetchNpmPackage } from '../lib/npm'
import { DownloadsGraph } from './downloads.client'
import { BarList } from './tremor'

export async function NPMStats() {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const both = combineStats(nuqs, nextUseQueryState)
  return (
    <>
      <h3 className="flex items-center gap-2 text-4xl font-bold">
        <Download size={32} /> {formatStatNumber(both.allTime)}
      </h3>
      <BarList
        data={[
          {
            name: 'next-usequerystate',
            value: nextUseQueryState.allTime,
            color: 'zinc'
          },
          { name: 'nuqs', value: nuqs.allTime, color: 'red' }
        ]}
        className="flex-1"
      />
    </>
  )
}

export async function NPMDownloads() {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const both = combineStats(nuqs, nextUseQueryState)
  return (
    <Suspense>
      <DownloadsGraph
        data={both.last90Days}
        dataKeys={['nuqs', 'next-usequerystate']}
        title={
          <>
            <Download size={20} /> Last 90 days
            <span aria-label="combined" className="ml-auto">
              {formatStatNumber(
                both.last90Days.reduce(
                  (sum, { nuqs, ['next-usequerystate']: n_uqs }) =>
                    sum + nuqs + n_uqs,
                  0
                )
              )}
            </span>
            <span aria-label="nuqs" className="mx-1 text-red-500">
              {formatStatNumber(
                nuqs.last90Days.reduce(
                  (sum, { downloads }) => sum + downloads,
                  0
                )
              )}
            </span>
            <span aria-label="next-usequerystate" className="text-zinc-500/50">
              {formatStatNumber(
                nextUseQueryState.last90Days.reduce(
                  (sum, { downloads }) => sum + downloads,
                  0
                )
              )}
            </span>
          </>
        }
      />
      <DownloadsGraph
        data={both.last30Days}
        dataKeys={['nuqs', 'next-usequerystate']}
        title={
          <>
            <Download size={20} /> Last 30 days
            <span aria-label="combined" className="ml-auto">
              {formatStatNumber(
                both.last30Days.reduce(
                  (sum, { nuqs, ['next-usequerystate']: n_uqs }) =>
                    sum + nuqs + n_uqs,
                  0
                )
              )}
            </span>
            <span aria-label="nuqs" className="mx-1 text-red-500">
              {formatStatNumber(
                nuqs.last30Days.reduce(
                  (sum, { downloads }) => sum + downloads,
                  0
                )
              )}
            </span>
            <span aria-label="next-usequerystate" className="text-zinc-500/50">
              {formatStatNumber(
                nextUseQueryState.last30Days.reduce(
                  (sum, { downloads }) => sum + downloads,
                  0
                )
              )}
            </span>
          </>
        }
      />
    </Suspense>
    // <section className={twMerge('relative', className)} {...props}>
    //   <LineChart
    //     data=

    //   />

    //   <SvgCurveGraph
    //     data={last30Days}
    //     lastDate={nuqs.lastDate}
    //     height={200}
    //     summaryValue={last30Days.reduce((sum, x) => sum + x)}
    //     className="text-red-500"
    //   />
    //   <p className="absolute left-2 top-2 flex items-center gap-2 text-2xl font-semibold tabular-nums md:text-6xl">
    //     <Download
    //       aria-label="NPM package downloads"
    //       className="inline-block md:h-12 md:w-12"
    //     />{' '}
    //     {formatter.format(totalDownloads)}
    //   </p>
    // </section>
  )
}
