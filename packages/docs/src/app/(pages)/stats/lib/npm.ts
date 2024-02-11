import dayjs from 'dayjs'
import 'server-only'

export type NpmPackageStatsData = {
  allTime: number
  last30Days: number[]
  lastDate: Date
}

// const regexp = /https:\/\/npmjs\.com\/package\/([\w.-]+|@[\w.-]+\/[\w.-]+)/gm

type RangeResponse = {
  downloads: Array<{
    downloads: number
    day: string
  }>
}

async function getLastNDays(
  pkg: string,
  n: number
): Promise<{ downloads: number[]; date: string }> {
  const start = dayjs().subtract(n, 'day').format('YYYY-MM-DD')
  const end = dayjs().subtract(1, 'day').endOf('day').format('YYYY-MM-DD')
  const url = `https://api.npmjs.org/downloads/range/${start}:${end}/${pkg}`
  const { downloads } = await get<RangeResponse>(url)
  return {
    downloads: downloads.map(d => d.downloads),
    date: end
  }
}

async function getAllTime(pkg: string): Promise<number> {
  let downloads: number = 0
  const now = dayjs()
  let start = dayjs('2015-01-10') // NPM stats epoch
  let end = start.add(18, 'month')
  while (start.isBefore(now)) {
    const url = `https://api.npmjs.org/downloads/range/${start.format(
      'YYYY-MM-DD'
    )}:${end.format('YYYY-MM-DD')}/${pkg}`
    const res = await get<RangeResponse>(url)
    downloads += res.downloads.reduce((sum, d) => sum + d.downloads, 0)
    start = end
    end = start.add(18, 'month')
  }
  return downloads
}

export async function fetchNpmPackage(
  pkg: string
): Promise<NpmPackageStatsData> {
  const [allTime, { downloads: last30Days, date: lastDate }] =
    await Promise.all([getAllTime(pkg), getLastNDays(pkg, 30)])
  return {
    allTime,
    lastDate: new Date(lastDate),
    last30Days
  }
}

async function get<T = any>(url: string) {
  const res = await fetch(url, {
    next: {
      revalidate: 86_400,
      tags: ['npm']
    }
  })
  return (await res.json()) as T
}
