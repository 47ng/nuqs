import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareLoose as semverSort, valid as semverValid } from 'semver'
import { z } from 'zod'

const versionLineSchema = z.object({
  package: z.union([z.literal('nuqs'), z.literal('next-usequerystate')]),
  date: z.string().length(10),
  downloads: z.record(z.number())
})

const creationDateSchema = z.record(
  z
    .string()
    .datetime()
    .transform(str => new Date(str).toISOString().slice(0, 10))
)

export type VersionRecord = z.infer<typeof versionLineSchema> & {
  total: number
  relative: Record<string, number>
  published: string[]
  latest: string
}

export async function getVersions() {
  const filePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    'versions.ndjson'
  )
  const file = await fs.readFile(filePath, 'utf-8')
  const dates = await getVersionsPublicationDates()
  return file
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      const json = JSON.parse(line)
      const parsed = versionLineSchema.parse(json)
      const record: VersionRecord = {
        date: parsed.date,
        total: Object.values(parsed.downloads).reduce((a, b) => a + b, 0),
        published: dates[parsed.date]?.published ?? [],
        latest: getLatestForDate(parsed.date, dates),
        downloads: Object.fromEntries(
          Object.entries(parsed.downloads).sort(([, a], [, b]) => b - a)
        ),
        package: parsed.package,
        relative: {}
      }
      record.relative = Object.fromEntries(
        Object.entries(record.downloads).map(([key, value]) => [
          key,
          value / record.total
        ])
      )
      return record
    })
}

export async function getVersionsPublicationDates() {
  const res = await fetch(`https://registry.npmjs.org/next-usequerystate`).then(
    r => r.json()
  )
  let latest = '0.0.0'
  const versionToDate = creationDateSchema.parse(res.time)
  const dates = Object.entries(versionToDate)
    .filter(([version]) => semverValid(version))
    .sort(([a], [b]) => semverSort(a, b))
    .reduce(
      (acc, [version, date]) => {
        latest = version
        if (!acc[date]) {
          acc[date] = {
            published: [],
            latest
          }
        }
        acc[date].published.push(version)
        acc[date].latest = latest
        return acc
      },
      {} as Record<
        string,
        {
          published: string[]
          latest: string
        }
      >
    )
  return dates
}

function getLatestForDate(
  date: string,
  dates: Awaited<ReturnType<typeof getVersionsPublicationDates>>
): string {
  const datesArray = Object.keys(dates)
  const index = datesArray.indexOf(date)
  if (index !== -1) {
    return datesArray[index]
  }
  // Get the latest date before the given date
  const before = datesArray
    .toSorted((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .filter(d => d < date)
  return dates[before[0]]?.latest ?? 'N.A.'
}
