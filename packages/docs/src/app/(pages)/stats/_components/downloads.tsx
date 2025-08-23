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
            <dl className="ml-auto flex gap-2">
              <dt className="sr-only">combined</dt>
              <dd>
                {formatStatNumber(
                  both.last90Days.reduce(
                    (sum, { nuqs, ['next-usequerystate']: n_uqs }) =>
                      sum + nuqs + n_uqs,
                    0
                  )
                )}
              </dd>
              <span className="font-light text-zinc-500" aria-hidden>
                |
              </span>
              <dt className="sr-only">nuqs</dt>
              <dd className="text-red-500">
                {formatStatNumber(
                  nuqs.last90Days.reduce(
                    (sum, { downloads }) => sum + downloads,
                    0
                  )
                )}
              </dd>
              <dt className="sr-only">next-usequerystate</dt>
              <dd className="text-zinc-500/50">
                {formatStatNumber(
                  nextUseQueryState.last90Days.reduce(
                    (sum, { downloads }) => sum + downloads,
                    0
                  )
                )}
              </dd>
            </dl>
          </>
        }
      />
      <DownloadsGraph
        data={both.last30Days}
        dataKeys={['nuqs', 'next-usequerystate']}
        title={
          <>
            <Download size={20} /> Last 30 days
            <dl className="ml-auto flex gap-2">
              <dt className="sr-only">combined</dt>
              <dd>
                {formatStatNumber(
                  both.last30Days.reduce(
                    (sum, { nuqs, ['next-usequerystate']: n_uqs }) =>
                      sum + nuqs + n_uqs,
                    0
                  )
                )}
              </dd>
              <span className="font-light text-zinc-500" aria-hidden>
                |
              </span>
              <dt className="sr-only">nuqs</dt>
              <dd className="text-red-500">
                {formatStatNumber(
                  nuqs.last30Days.reduce(
                    (sum, { downloads }) => sum + downloads,
                    0
                  )
                )}
              </dd>
              <dt className="sr-only">next-usequerystate</dt>
              <dd className="text-zinc-500/50">
                {formatStatNumber(
                  nextUseQueryState.last30Days.reduce(
                    (sum, { downloads }) => sum + downloads,
                    0
                  )
                )}
              </dd>
            </dl>
          </>
        }
      />
    </Suspense>
  )
}
