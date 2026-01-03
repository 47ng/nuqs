import { type Activity } from '@/src/components/kibo-ui/contribution-graph'
import { Suspense } from 'react'
import { z } from 'zod'
import { ReleaseContributionGraphClient } from './release-contribution-graph.client'

function ReleaseContributionGraphSkeleton() {
  return (
    <div className="flex w-full max-w-[686px] flex-col gap-2">
      <div className="bg-muted h-[108px] animate-pulse rounded" />
      <div className="flex h-7 items-center justify-between">
        <div className="bg-muted h-4.5 w-36 animate-pulse rounded" />
        <div className="bg-muted h-4.5 w-44 animate-pulse rounded" />
      </div>
    </div>
  )
}

export function ReleaseContributionGraph({
  year
}: ReleaseContributionGraphProps) {
  return (
    <div className="my-12 flex flex-col items-center justify-center">
      <Suspense fallback={<ReleaseContributionGraphSkeleton />}>
        <ReleaseContributionGraphLoader year={year} />
      </Suspense>
    </div>
  )
}

// --

const gitHubReleaseSchema = z.object({
  tag_name: z.string(),
  published_at: z.string()
})

const gitHubReleasesSchema = z.array(gitHubReleaseSchema)

type GitHubRelease = z.infer<typeof gitHubReleaseSchema>

async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  const releases: GitHubRelease[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/47ng/nuqs/releases?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const json = await response.json()
    const data = gitHubReleasesSchema.parse(json)

    if (data.length === 0) {
      break
    }

    releases.push(...data)

    if (data.length < perPage) {
      break
    }

    page++
  }

  return releases
}

function isBetaVersion(tag: string): boolean {
  return tag.includes('beta') || tag.includes('alpha') || tag.includes('rc')
}

type ReleaseDay = {
  date: string
  hasStable: boolean
  hasBeta: boolean
  versions: string[]
}

export type ReleasesByDate = Record<string, string[]>

type ProcessedReleases = {
  activities: Activity[]
  releasesByDate: ReleasesByDate
}

function processReleases(
  releases: GitHubRelease[],
  year: number
): ProcessedReleases {
  const yearPrefix = `${year}-`

  // Filter to specified year releases only
  const yearReleases = releases.filter(r =>
    r.published_at.startsWith(yearPrefix)
  )

  // Group releases by date
  const releaseDayMap = new Map<string, ReleaseDay>()

  for (const release of yearReleases) {
    const date = release.published_at.split('T')[0]
    const isBeta = isBetaVersion(release.tag_name)

    const existing = releaseDayMap.get(date)
    if (existing) {
      if (isBeta) {
        existing.hasBeta = true
      } else {
        existing.hasStable = true
      }
      existing.versions.push(release.tag_name)
    } else {
      releaseDayMap.set(date, {
        date,
        hasStable: !isBeta,
        hasBeta: isBeta,
        versions: [release.tag_name]
      })
    }
  }

  // Generate all days of the year
  const startDate = new Date(`${year}-01-01`)
  const endDate = new Date(`${year}-12-31`)
  const activities: Activity[] = []

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const releaseDay = releaseDayMap.get(dateStr)

    let level = 0
    if (releaseDay?.hasStable) {
      level = 2 // Green for stable
    } else if (releaseDay?.hasBeta) {
      level = 1 // Amber for beta
    }

    activities.push({
      date: dateStr,
      count: level > 0 ? 1 : 0,
      level
    })
  }

  // Convert map to plain object for serialization
  const releasesByDate: ReleasesByDate = {}
  for (const [date, day] of releaseDayMap) {
    releasesByDate[date] = day.versions
  }

  return { activities, releasesByDate }
}

type ReleaseContributionGraphProps = {
  year: number
}

async function ReleaseContributionGraphLoader({
  year
}: ReleaseContributionGraphProps) {
  const releases = await fetchGitHubReleases()
  const { activities, releasesByDate } = processReleases(releases, year)
  const stableCount = activities.filter(a => a.level === 2).length
  const betaCount = activities.filter(a => a.level === 1).length

  return (
    <ReleaseContributionGraphClient
      activities={activities}
      releasesByDate={releasesByDate}
      stableCount={stableCount}
      betaCount={betaCount}
    />
  )
}
