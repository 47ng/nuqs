import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'server-only'
import { z } from 'zod'

dayjs.extend(utc)

export type GitHubStarHistory = {
  count: number
  bins: Array<{
    stars: number // Value at the end of the day
    diff: number // Stars earned during the day
    date: string
  }>
}

const WINDOW_DAYS = 12
const WEEKS_OVERLAPPING_WINDOW = Math.ceil((WINDOW_DAYS + 6) / 7)

const stargazerCountQuerySchema = z.object({
  data: z.object({
    repository: z.object({ stargazerCount: z.number() }).nullable()
  }),
  errors: z.array(z.object({ message: z.string() })).optional()
})

const starHistorySchema = z.array(
  z.object({
    week: z.number(),
    days: z.array(z.number()).length(7)
  })
)

export async function getStarHistory(
  slug = '47ng/nuqs'
): Promise<GitHubStarHistory | null> {
  if (!process.env.GITHUB_TOKEN) {
    console.warn('GITHUB_TOKEN is not set: star history is unavailable.')
    return null
  }
  const count = await getStargazerCount(slug, process.env.GITHUB_TOKEN)
  if (count === null) {
    return null
  }
  const starsPerDay = await getStarsPerDay(slug, process.env.GITHUB_TOKEN)

  const todayStart = dayjs().utc().startOf('day')
  const bins: GitHubStarHistory['bins'] = []
  for (let i = 0; i < WINDOW_DAYS; ++i) {
    const date = todayStart.subtract(i, 'day').format('YYYY-MM-DD')
    const diff = starsPerDay.get(date) ?? 0
    const stars = i === 0 ? count : bins[i - 1].stars - bins[i - 1].diff
    bins.push({ stars, diff, date })
  }
  return { count, bins }
}

async function getStargazerCount(
  slug: string,
  token: string
): Promise<number | null> {
  const [owner, repo] = slug.split('/')
  const query = `query { repository(owner: "${owner}", name: "${repo}") { stargazerCount } }`
  const res = await fetch(
    'https://api.github.com/graphql?fn=getStargazerCount',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `bearer ${token}`
      },
      body: JSON.stringify({ query })
    }
  )
  await assertOk(res)
  const response = stargazerCountQuerySchema.parse(await res.json())
  if (response.data.repository === null) {
    const message =
      response.errors?.map(error => error.message).join('; ') ||
      'Repository data is unavailable'
    console.error(new Error(`GitHub API error: ${message}`))
    return null
  }
  return response.data.repository.stargazerCount
}

async function getStarsPerDay(
  slug: string,
  token: string
): Promise<Map<string, number>> {
  const res = await fetch(
    `https://api.github.com/repos/${slug}/stargazers/history?per_page=${WEEKS_OVERLAPPING_WINDOW}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2026-03-10'
      }
    }
  )
  await assertOk(res)
  const weeks = starHistorySchema.parse(await res.json())
  const starsPerDay = new Map<string, number>()
  for (const { week, days } of weeks) {
    const sunday = nearestUtcSunday(week)
    days.forEach((stars, i) => {
      starsPerDay.set(sunday.add(i, 'day').format('YYYY-MM-DD'), stars)
    })
  }
  return starsPerDay
}

function nearestUtcSunday(unixSeconds: number) {
  return dayjs.unix(unixSeconds).utc().add(84, 'hour').startOf('week')
}

async function assertOk(res: Response) {
  if (!res.ok) {
    throw new Error(
      `GitHub API error: ${res.status} ${res.statusText}
${res.url}
${await res.text()}`
    )
  }
}
