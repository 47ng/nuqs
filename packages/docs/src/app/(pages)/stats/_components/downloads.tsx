import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/src/lib/utils'
import { Download, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { formatStatNumber } from '../lib/format'
import {
  combineStats,
  fetchNpmPackage,
  getIsoWeekday,
  getPartialPreviousWeekDownloads
} from '../lib/npm'
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
        <dd title={`All time, combined: ${both.allTime}`}>
          {formatStatNumber(both.allTime)}
        </dd>
        <span className="font-light text-zinc-500" aria-hidden>
          |
        </span>
        <dt className="sr-only">nuqs</dt>
        <dd className="text-red-500" title={`All time, nuqs: ${nuqs.allTime}`}>
          {formatStatNumber(nuqs.allTime)}
        </dd>
        <dt className="sr-only">next-usequerystate</dt>
        <dd
          className="text-zinc-500/50"
          title={`All time, next-usequerystate: ${nextUseQueryState.allTime}`}
        >
          {formatStatNumber(nextUseQueryState.allTime)}
        </dd>
      </dl>
    </>
  )
}

export const NPMStatsSkeleton = () => (
  <div className="bg-muted h-9 w-64 animate-pulse rounded-md lg:h-12" />
)

export async function NPMDownloads() {
  const [nuqs, nextUseQueryState] = await Promise.all([
    fetchNpmPackage('nuqs'),
    fetchNpmPackage('next-usequerystate')
  ])
  const both = combineStats(nuqs, nextUseQueryState)
  const lastDate = both.last30Days.at(-1)?.date
  const lastDateWeekday = getIsoWeekday(lastDate ?? '')
  // Fortunately the epoch did not land on a Sunday (it was a Thursday).
  const isLastDateSunday = lastDateWeekday === 7
  return (
    <>
      <DownloadsGraph
        data={both.last90Days}
        partialLast={!isLastDateSunday}
        trend={
          <TrendBadge
            label={`nuqs downloads this week vs ${isLastDateSunday ? 'last week' : `the first ${lastDateWeekday} days of last week`}`}
            // Compare the N days of the current week (possibly pending)
            // to the first N days of the previous week.
            oldValue={getPartialPreviousWeekDownloads(nuqs.last30Days)}
            newValue={nuqs.last90Days.at(-1)?.downloads ?? 0}
          />
        }
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
        trend={
          <TrendBadge
            label="nuqs downloads compared to 7 days ago"
            oldValue={nuqs.last30Days.at(-8)?.downloads ?? 0}
            newValue={nuqs.last30Days.at(-1)?.downloads ?? 0}
          />
        }
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

// --

type TrendBadgeProps = {
  oldValue: number
  newValue: number
  label: string
}

function TrendBadge({ oldValue, newValue, label }: TrendBadgeProps) {
  const diff = newValue - oldValue
  const pct = oldValue === 0 ? 100 : (diff / oldValue) * 100
  const sign = diff === 0 ? '' : diff > 0 ? '+' : '-'
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.25 rounded-md border-none pl-1.5',
        diff > 0 && 'bg-green-500/10 text-green-500',
        diff < 0 && 'bg-red-500/10 text-red-500',
        diff === 0 && 'bg-zinc-500/10 text-zinc-500'
      )}
      title={`${sign}${Math.abs(diff)} ${label}`}
    >
      {diff > 0 && <TrendingUp size={12} />}
      {diff < 0 && <TrendingDown size={12} />}
      {diff === 0 && <Minus size={12} />}
      {diff > 0 ? '+' : '-'}
      {formatStatNumber(Math.abs(diff)) || 'No change'}
      {oldValue !== 0 && (
        <span className="font-normal">({pct.toFixed(1)}%)</span>
      )}
    </Badge>
  )
}
