import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import minMax from 'dayjs/plugin/minMax'
import { cacheLife, cacheTag } from 'next/cache'
import 'server-only'
import { z } from 'zod'

dayjs.extend(isoWeek)
dayjs.extend(minMax)

export type Datum = {
  date: string
  downloads: number
}

export type MultiDatum = {
  date: string
  nuqs: number
  'next-usequerystate': number
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
  'use cache'
  cacheTag('npm')
  cacheLife('days')
  // Ensure we cover 90 days + a full first week
  const startOfFirstWeek = dayjs().subtract(90, 'day').startOf('isoWeek')
  const ninetyOrSoDays = dayjs().diff(startOfFirstWeek, 'day')
  const [allTime, last30Days, last90Days] = await Promise.all([
    getAllTime(pkg),
    getLastNDays(pkg, 30),
    getLastNDays(pkg, ninetyOrSoDays)
  ])
  return {
    allTime,
    last30Days,
    last90Days: groupByWeek(last90Days)
  }
}

async function get(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: {
      revalidate: 86_400,
      tags: ['npm']
    }
  })
  return res.json()
}

function groupByWeek(data: Datum[]): Datum[] {
  const weeks = new Map<string, number>()
  for (const d of data) {
    const date = dayjs(d.date)
    const key = [
      "'" + (date.year() - 2000),
      date.isoWeek().toFixed().padStart(2, '0')
    ].join('W')
    weeks.set(key, (weeks.get(key) ?? 0) + d.downloads)
  }
  return Array.from(weeks.entries()).map(([date, downloads]) => ({
    date,
    downloads
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
      ['next-usequerystate']: n_uqs.last30Days[i].downloads
    })),
    last90Days: nuqs.last90Days.map((d, i) => ({
      date: d.date,
      nuqs: d.downloads,
      ['next-usequerystate']: n_uqs.last90Days[i].downloads
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
