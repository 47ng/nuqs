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

export type MultiDatum = {
  date: string
  nuqs: number
  'next-usequerystate': number
  estimated?: boolean
}

export type NpmPackageStatsData = {
  allTime: number
  last30Days: Datum[]
  last90Days: Datum[]
}

// const regexp = /https:\/\/npmjs\.com\/package\/([\w.-]+|@[\w.-]+\/[\w.-]+)/gm

type RangeResponse = {
  downloads: Array<{
    downloads: number
    day: string
  }>
}

const rangeResponseSchema = z.object({
  downloads: z.array(
    z.object({
      downloads: z.number(),
      day: z.string()
    })
  )
})

async function getLastNDays(pkg: string, n: number): Promise<Datum[]> {
  const start = dayjs().subtract(n, 'day').format('YYYY-MM-DD')
  const end = dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DD')
  const url = `https://api.npmjs.org/downloads/range/${start}:${end}/${pkg}`
  try {
    const { downloads } = rangeResponseSchema.parse(await get(url))
    const data = downloads.map(d => ({
      date: d.day,
      downloads: d.downloads
    }))
    if (data.at(-1)?.downloads === 0) {
      data.pop() // Remove last day if it's zero (stats not available yet)
    }
    return data
  } catch (cause) {
    const error = new Error(`error: getLastNDays(${pkg}, ${n}) - url: ${url}`, {
      cause
    })
    console.error(error)
    return []
  }
}

/**
 * Interpolate zero-download days using weekly rhythm-aware estimation.
 * Processes left-to-right so earlier interpolated values can feed later ones.
 */
function interpolateZeroDays(data: Datum[]): Datum[] {
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
        (data[i - 1].downloads - data[i - 8].downloads) /
        data[i - 8].downloads
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
        (data[i + 1].downloads - data[i - 6].downloads) /
        data[i - 6].downloads
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

const packageResponseSchema = z.object({
  time: z.object({
    created: z.string()
  })
})

async function getPackageCreationDate(pkg: string): Promise<dayjs.Dayjs> {
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

async function getAllTime(pkg: string): Promise<number> {
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

export async function fetchNpmPackage(
  pkg: string
): Promise<NpmPackageStatsData> {
  // Ensure we cover 90 days + a full first week
  const startOfFirstWeek = dayjs().subtract(90, 'day').startOf('isoWeek')
  const ninetyOrSoDays = dayjs().diff(startOfFirstWeek, 'day')
  const [allTime, last30DaysRaw, last90DaysRaw] = await Promise.all([
    getAllTime(pkg),
    getLastNDays(pkg, 30),
    getLastNDays(pkg, ninetyOrSoDays)
  ])
  const last30Days = interpolateZeroDays(last30DaysRaw)
  const last90Days = interpolateZeroDays(last90DaysRaw)
  return {
    allTime,
    last30Days,
    last90Days: groupByWeek(last90Days)
  }
}

async function get(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: {
      revalidate: 6 * 60 * 60, // 6 hours
      tags: ['npm-stats']
    }
  })
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
  return Array.from(weeks.entries()).map(([date, { downloads, estimated }]) => ({
    date,
    downloads,
    ...(estimated ? { estimated: true } : {})
  }))
}

export function combineStats(
  nuqs: NpmPackageStatsData,
  n_uqs: NpmPackageStatsData
) {
  return {
    allTime: nuqs.allTime + n_uqs.allTime,
    last30Days: nuqs.last30Days.map((d, i) => ({
      date: d.date,
      nuqs: d.downloads,
      ['next-usequerystate']: n_uqs.last30Days[i].downloads,
      ...(d.estimated ? { estimated: true } : {})
    })),
    last90Days: nuqs.last90Days.map((d, i) => ({
      date: d.date,
      nuqs: d.downloads,
      ['next-usequerystate']: n_uqs.last90Days[i].downloads,
      ...(d.estimated ? { estimated: true } : {})
    }))
  }
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
