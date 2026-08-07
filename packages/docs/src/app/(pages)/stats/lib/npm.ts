import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import minMax from 'dayjs/plugin/minMax'
import 'server-only'
import { z } from 'zod'

dayjs.extend(isoWeek)
dayjs.extend(minMax)

export type Datum = {
  date: string
  downloads: number
  estimated?: boolean
}

export type MultiDatumSeries = 'nuqs' | 'next-usequerystate'

export type MultiDatum = {
  date: string
  nuqs: number
  'next-usequerystate': number
  estimated?: Partial<Record<MultiDatumSeries, true>>
}

export type NpmPackageStatsData = {
  allTime: number
  last30Days: Datum[]
  last90Days: Datum[]
}

const rangeResponseSchema = z.object({
  downloads: z.array(
    z.object({
      downloads: z.number(),
      day: z.string()
    })
  )
})

const combinedRangeResponseSchema = z.object({
  nuqs: rangeResponseSchema,
  'next-usequerystate': rangeResponseSchema
})

/**
 * Interpolate zero-download days in a dense, chronological daily series.
 * Mutates the array from left to right so earlier estimates can feed later ones.
 */
export function interpolateZeroDays(data: Datum[]): Datum[] {
  for (let i = 0; i < data.length; i++) {
    if (data[i].downloads !== 0) continue

    // D-7: same weekday last week
    if (i - 7 < 0) continue
    const base = data[i - 7].downloads
    if (base === 0) continue

    // Backward trend: (D-1 vs D-8) week-over-week
    let backwardTrend: number | null = null
    if (
      i - 1 >= 0 &&
      i - 8 >= 0 &&
      data[i - 1].downloads > 0 &&
      data[i - 8].downloads > 0
    ) {
      backwardTrend =
        (data[i - 1].downloads - data[i - 8].downloads) / data[i - 8].downloads
    }

    // Forward trend: (D+1 vs D-6) week-over-week
    let forwardTrend: number | null = null
    if (
      i + 1 < data.length &&
      i - 6 >= 0 &&
      data[i + 1].downloads > 0 &&
      data[i - 6].downloads > 0
    ) {
      forwardTrend =
        (data[i + 1].downloads - data[i - 6].downloads) / data[i - 6].downloads
    }

    // Average available trends
    let trend: number
    if (backwardTrend !== null && forwardTrend !== null) {
      trend = (backwardTrend + forwardTrend) / 2
    } else if (backwardTrend !== null) {
      trend = backwardTrend
    } else if (forwardTrend !== null) {
      trend = forwardTrend
    } else {
      trend = 0
    }

    data[i] = {
      date: data[i].date,
      downloads: Math.max(0, Math.round(base * (1 + trend))),
      estimated: true
    }
  }
  return data
}

export function getDownloadsNDaysBeforeLatest(
  data: Datum[],
  days: number
): Datum | undefined {
  const latestDate = data.at(-1)?.date
  if (!latestDate) return undefined
  const targetDate = dayjs(latestDate)
    .subtract(days, 'day')
    .format('YYYY-MM-DD')
  return data.find(d => d.date === targetDate)
}

const packageResponseSchema = z.object({
  time: z.object({
    created: z.string()
  })
})

export async function getPackageCreationDate(
  pkg: string
): Promise<dayjs.Dayjs> {
  const npmStatsEpoch = dayjs('2015-01-10')
  const url = `https://registry.npmjs.org/${pkg}`
  try {
    const { time } = packageResponseSchema.parse(await get(url))
    return dayjs.max(npmStatsEpoch, dayjs(time.created))
  } catch (cause) {
    const error = new Error(
      `error: getPackageCreationDate(${pkg}) - url: ${url}, falling back to npm stats epoch`,
      { cause }
    )
    console.error(error)
    return npmStatsEpoch
  }
}

export async function getAllTime(pkg: string): Promise<number> {
  let downloads: number = 0
  let start = dayjs(await getPackageCreationDate(pkg))
  let end = start.add(18, 'month')
  const now = dayjs()
  while (start.isBefore(now)) {
    const url = `https://api.npmjs.org/downloads/range/${start.format(
      'YYYY-MM-DD'
    )}:${end.format('YYYY-MM-DD')}/${pkg}`
    try {
      const res = rangeResponseSchema.parse(await get(url))
      downloads += res.downloads.reduce((sum, d) => sum + d.downloads, 0)
      start = end
      end = start.add(18, 'month')
    } catch (cause) {
      const error = new Error(`error: getAllTime(${pkg}) - url: ${url}`, {
        cause
      })
      console.error(error)
      break
    }
  }
  return downloads
}

async function getRecentPackages(url: string) {
  try {
    return combinedRangeResponseSchema.parse(await get(url))
  } catch (cause) {
    console.error(
      new Error(`error: getRecentPackages() - url: ${url}`, { cause })
    )
    return {
      nuqs: { downloads: [] },
      'next-usequerystate': { downloads: [] }
    }
  }
}

export async function fetchNpmPackages(): Promise<
  readonly [nuqs: NpmPackageStatsData, nextUseQueryState: NpmPackageStatsData]
> {
  // Fetch one range for both packages, then derive both chart windows locally.
  // This keeps all recent views on the same npm response and cache entry.
  const startOfFirstWeek = dayjs().subtract(90, 'day').startOf('isoWeek')
  const endDate = dayjs().subtract(1, 'day')
  const end = endDate.format('YYYY-MM-DD')
  const last30DaysStart = endDate.subtract(29, 'day').format('YYYY-MM-DD')
  const rangeDates: string[] = []
  for (
    let date = startOfFirstWeek;
    !date.isAfter(endDate, 'day');
    date = date.add(1, 'day')
  ) {
    rangeDates.push(date.format('YYYY-MM-DD'))
  }
  const url = `https://api.npmjs.org/downloads/range/${startOfFirstWeek.format(
    'YYYY-MM-DD'
  )}:${end}/nuqs,next-usequerystate`
  const [nuqsAllTime, nextUseQueryStateAllTime, recent] = await Promise.all([
    getAllTime('nuqs'),
    getAllTime('next-usequerystate'),
    getRecentPackages(url)
  ])
  const nuqsByDate = new Map(
    recent.nuqs.downloads.map(d => [d.day, d.downloads])
  )
  const nextUseQueryStateByDate = new Map(
    recent['next-usequerystate'].downloads.map(d => [d.day, d.downloads])
  )
  const sharedDates = new Set(
    rangeDates.filter(
      date => nuqsByDate.has(date) && nextUseQueryStateByDate.has(date)
    )
  )
  // npm can include tomorrow's placeholder before either package has stats.
  // Drop that date only when both package totals are still zero.
  const lastSharedDate = rangeDates.findLast(date => sharedDates.has(date))
  if (
    lastSharedDate &&
    nuqsByDate.get(lastSharedDate) === 0 &&
    nextUseQueryStateByDate.get(lastSharedDate) === 0
  ) {
    sharedDates.delete(lastSharedDate)
  }
  const nuqs = interpolateZeroDays(
    rangeDates.map(date => ({
      date,
      downloads: nuqsByDate.get(date) ?? 0
    }))
  ).filter(d => sharedDates.has(d.date))
  const nextUseQueryState = interpolateZeroDays(
    rangeDates.map(date => ({
      date,
      downloads: nextUseQueryStateByDate.get(date) ?? 0
    }))
  ).filter(d => sharedDates.has(d.date))
  return [
    {
      allTime: nuqsAllTime,
      last30Days: nuqs.filter(d => d.date >= last30DaysStart),
      last90Days: groupByWeek(nuqs)
    },
    {
      allTime: nextUseQueryStateAllTime,
      last30Days: nextUseQueryState.filter(d => d.date >= last30DaysStart),
      last90Days: groupByWeek(nextUseQueryState)
    }
  ]
}

async function get(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: {
      revalidate: 6 * 60 * 60, // 6 hours
      tags: ['npm-stats']
    }
  })
  if (!res.ok) {
    throw new Error(
      `npm downloads request failed: ${res.status} ${res.statusText}`
    )
  }
  return res.json()
}

function groupByWeek(data: Datum[]): Datum[] {
  const weeks = new Map<string, { downloads: number; estimated: boolean }>()
  for (const d of data) {
    const date = dayjs(d.date)
    const key = [
      "'" + (date.isoWeekYear() - 2000),
      date.isoWeek().toFixed().padStart(2, '0')
    ].join('W')
    const existing = weeks.get(key) ?? { downloads: 0, estimated: false }
    weeks.set(key, {
      downloads: existing.downloads + d.downloads,
      estimated: existing.estimated || (d.estimated ?? false)
    })
  }
  return Array.from(weeks.entries()).map(
    ([date, { downloads, estimated }]) => ({
      date,
      downloads,
      ...(estimated ? { estimated: true } : {})
    })
  )
}

export function combineStats(
  nuqs: NpmPackageStatsData,
  n_uqs: NpmPackageStatsData
) {
  return {
    allTime: nuqs.allTime + n_uqs.allTime,
    last30Days: combineDownloads(nuqs.last30Days, n_uqs.last30Days),
    last90Days: combineDownloads(nuqs.last90Days, n_uqs.last90Days)
  }
}

function combineDownloads(nuqs: Datum[], n_uqs: Datum[]): MultiDatum[] {
  const nuqsByDate = new Map(nuqs.map(datum => [datum.date, datum]))
  const n_uqsByDate = new Map(n_uqs.map(datum => [datum.date, datum]))
  const dates = Array.from(nuqsByDate.keys()).filter(date =>
    n_uqsByDate.has(date)
  )

  return dates.sort().map(date => {
    const nuqsDatum = nuqsByDate.get(date)!
    const n_uqsDatum = n_uqsByDate.get(date)!
    const estimated: NonNullable<MultiDatum['estimated']> = {}
    if (nuqsDatum.estimated) estimated.nuqs = true
    if (n_uqsDatum.estimated) estimated['next-usequerystate'] = true
    return {
      date,
      nuqs: nuqsDatum.downloads,
      'next-usequerystate': n_uqsDatum.downloads,
      ...(Object.keys(estimated).length > 0 ? { estimated } : {})
    }
  })
}

// Re-export to avoid importing dayjs everywhere
// ISO weekday: 1 (Monday) - 7 (Sunday)
export function getIsoWeekday(date: string) {
  const lastDay = dayjs(date)
  return lastDay.isoWeekday()
}

export function getPartialPreviousWeekDownloads(data: Datum[]) {
  const lastDate = data.at(-1)?.date
  if (!lastDate) return 0
  const lastDay = dayjs(lastDate)
  const startOfLastWeek = lastDay.startOf('isoWeek').subtract(7, 'day')
  const numDaysInCurrentWeek = lastDay.isoWeekday()
  const filtered = data.filter(d => {
    const date = dayjs(d.date)
    return (
      date.isSame(startOfLastWeek) ||
      (date.isAfter(startOfLastWeek) &&
        date.isBefore(startOfLastWeek.add(numDaysInCurrentWeek, 'day')))
    )
  })
  return filtered.reduce((sum, d) => sum + d.downloads, 0)
}
