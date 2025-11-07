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
    stargarzers: Array<{
      login: string
      name: string | null
      avatarUrl: string
      company: string | null
      followers: number
    }>
  }>
}

const starHistoryQuerySchema = z.object({
  data: z.object({
    repository: z.object({
      stargazers: z.object({
        totalCount: z.number(),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullish()
        }),
        edges: z.array(
          z.object({
            starredAt: z
              .string()
              .datetime()
              .transform(d => new Date(d)),
            node: z.object({
              login: z.string(),
              name: z.string().nullish(),
              avatarUrl: z.string(),
              company: z.string().nullish(),
              followers: z.object({
                totalCount: z.number()
              })
            })
          })
        )
      })
    })
  })
})

export async function getStarHistory(
  slug = '47ng/nuqs'
): Promise<GitHubStarHistory> {
  const [owner, repo] = slug.split('/')

  // Compute the 12-day window [today .. today-11d] in UTC
  const todayStart = dayjs().utc().startOf('day')
  const days = Array.from({ length: 12 }, (_, i) =>
    todayStart.clone().subtract(i, 'day').format('YYYY-MM-DD')
  )
  const windowStart = todayStart.clone().subtract(11, 'day') // already startOf('day')

  // Pre-initialize bins for consecutive days (including empty days), most recent first
  const bins: GitHubStarHistory['bins'] = days.map(date => ({
    stars: 0,
    diff: 0,
    date,
    stargarzers: []
  }))

  // Paginate through stargazers 100 at a time until we reach older than the window start
  let after: string | undefined
  let hasNextPage = true
  let totalCount = 0

  while (hasNextPage) {
    const afterClause = after ? `, after: "${after}"` : ''
    const query = `query {
  repository(owner: "${owner}", name: "${repo}") {
    stargazers(first: 100, orderBy: {field: STARRED_AT, direction: DESC}${afterClause}) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        starredAt
        node {
          login
          name
          avatarUrl
          company
          followers {
            totalCount
          }
        }
      }
    }
  }
}`.replace(/\s+/g, ' ') // Minify
    const res = await fetch(`https://api.github.com/graphql?stars=${slug}`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query })
    })

    const {
      data: {
        repository: {
          stargazers: { totalCount: tc, pageInfo, edges }
        }
      }
    } = starHistoryQuerySchema.parse(await res.json())

    totalCount = tc

    // Fill bins for edges within the 12-day window
    for (const { starredAt, node } of edges) {
      const starredAtUtc = dayjs.utc(starredAt)
      if (starredAtUtc.isBefore(windowStart)) {
        // We already went beyond the 12-day window; stop after this page
        hasNextPage = false
        continue
      }
      const dateStr = starredAtUtc.format('YYYY-MM-DD')
      const idx = days.indexOf(dateStr)
      if (idx !== -1) {
        bins[idx].stars++
        bins[idx].stargarzers.push({
          login: node.login,
          name: node.name ?? null,
          avatarUrl: node.avatarUrl,
          company: node.company ?? null,
          followers: node.followers.totalCount
        })
      }
    }

    // Decide if we should continue pagination
    if (!pageInfo.hasNextPage) {
      hasNextPage = false
    } else if (edges.length > 0) {
      const oldestInPage = dayjs.utc(edges[edges.length - 1].starredAt)
      if (oldestInPage.isBefore(windowStart)) {
        hasNextPage = false
      } else {
        after = pageInfo.endCursor ?? undefined
      }
    } else {
      hasNextPage = false
    }
  }

  // Compute end-of-day star totals using totalCount
  if (bins.length > 0) {
    bins[0].diff = bins[0].stars
    bins[0].stars = totalCount
    for (let i = 1; i < bins.length; ++i) {
      bins[i].diff = bins[i].stars
      bins[i].stars = bins[i - 1].stars - bins[i - 1].diff
    }
  }

  return {
    count: totalCount,
    bins
  }
}
