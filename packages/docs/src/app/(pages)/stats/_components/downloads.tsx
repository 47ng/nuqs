import { Download } from 'lucide-react'
import { formatStatNumber } from '../lib/format'
import { combineStats, fetchNpmPackage } from '../lib/npm'
import { DownloadsGraph } from './downloads.client'
import { GraphSkeleton } from './graph.skeleton'
import { WidgetSkeleton } from './widget.skeleton'

export async function NPMStats() {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const both = combineStats(nuqs, nextUseQueryState)
  return (
    <>
      <dl className="flex items-center gap-3 text-3xl font-bold lg:text-4xl">
        <Download className="size-7 lg:size-9" />
        <dt className="sr-only">combined</dt>
        <dd title="All time, combined">{formatStatNumber(both.allTime)}</dd>
        <span className="font-light text-zinc-500" aria-hidden>
          |
        </span>
        <dt className="sr-only">nuqs</dt>
        <dd className="text-red-500" title="All time, nuqs">
          {formatStatNumber(nuqs.allTime)}
        </dd>
        <dt className="sr-only">next-usequerystate</dt>
        <dd className="text-zinc-500/50" title="All time, next-usequerystate">
          {formatStatNumber(nextUseQueryState.allTime)}
        </dd>
      </dl>
      {/* todo: Add contributors list? */}
    </>
  )
}

export async function NPMDownloads() {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const both = combineStats(nuqs, nextUseQueryState)
  const lastDate = both.last30Days.at(-1)?.date
  // Fortunately the epoch did not land on a Sunday (it was a Thursday).
  const isLastDateSunday = new Date(lastDate ?? 0).getDay() === 0
  return (
    <>
      <DownloadsGraph
        data={both.last90Days}
        partialLast={!isLastDateSunday}
        title={
          <>
            <Download size={20} /> Last 90 days
            <dl className="mr-1 ml-auto flex gap-2">
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
        partialLast={false}
        title={
          <>
            <Download size={20} /> Last 30 days
            <dl className="mr-1 ml-auto flex gap-2">
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
    </>
  )
}

export function NPMDownloadsSkeleton() {
  return (
    <>
      <WidgetSkeleton
        title={
          <div className="flex w-full items-center gap-2">
            <Download size={20} /> Last 90 days
            <div className="bg-muted ml-auto h-6 w-40 animate-pulse rounded-md" />
          </div>
        }
      >
        <div className="flex w-full justify-end py-2">
          <div className="bg-muted h-4 w-52 animate-pulse rounded-md" />
        </div>
        <GraphSkeleton className="h-69" />
      </WidgetSkeleton>
      <WidgetSkeleton
        title={
          <div className="flex w-full items-center gap-2">
            <Download size={20} /> Last 30 days
            <div className="bg-muted ml-auto h-6 w-40 animate-pulse rounded-md" />
          </div>
        }
      >
        <div className="flex w-full justify-end py-2">
          <div className="bg-muted h-4 w-52 animate-pulse rounded-md" />
        </div>
        <div className="flex h-69 w-full animate-pulse flex-col justify-between pt-1 pr-1 pl-10 opacity-50">
          <hr />
          <hr />
          <hr />
          <hr />
          <hr />
        </div>
      </WidgetSkeleton>
    </>
  )
}
