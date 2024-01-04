import 'server-only'
import { z } from 'zod'

export type GitHubRepositoryData = {
  version?: string
  stars: number
  issues: number
  prs: number
  updatedAt: Date
}

const repositoryQuerySchema = z.object({
  data: z.object({
    repository: z.object({
      latestRelease: z
        .object({
          tagName: z.string().nullish()
        })
        .nullish(),
      issues: z.object({
        totalCount: z.number()
      }),
      pullRequests: z.object({
        totalCount: z.number()
      }),
      stargazerCount: z.number()
    })
  })
})

export async function fetchRepository(
  slug = '47ng/nuqs'
): Promise<GitHubRepositoryData> {
  const [owner, repo] = slug.split('/')
  const query = `query {
  repository(owner: "${owner}", name: "${repo}") {
    latestRelease {
      tagName
    }
    issues(states: OPEN) {
      totalCount
    }
    pullRequests(states: OPEN) {
      totalCount
    }
    stargazerCount
  }
}`.replace(/\s+/g, ' ') // Minify
  // The querystring is not necessary but it helps tagging cache entries in Cache Explorer
  const res = await fetch(`https://api.github.com/graphql?repo=${slug}`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify({ query }),
    next: {
      tags: ['github'],
      revalidate: 3600 // 1h
    }
  })
  const {
    data: { repository }
  } = repositoryQuerySchema.parse(await res.json())
  return {
    issues: repository.issues.totalCount,
    prs: repository.pullRequests.totalCount,
    stars: repository.stargazerCount,
    version: repository.latestRelease?.tagName?.replace(/^v/, '') ?? undefined,
    updatedAt: new Date()
  }
}

// --

export type GitHubStarHistory = {
  count: number
  bins: Array<{
    stars: number // Value at the end of the day
    diff: number // Stars earned during the day
    date: Date
  }>
}

const starHistoryQuerySchema = z.object({
  data: z.object({
    repository: z.object({
      stargazers: z.object({
        totalCount: z.number(),
        edges: z.array(
          z.object({
            starredAt: z
              .string()
              .datetime()
              .transform(d => new Date(d))
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
  const query = `query {
  repository(owner: "${owner}", name: "${repo}") {
    stargazers(first: 100, orderBy: {field: STARRED_AT, direction: DESC}) {
      totalCount
      edges {
        starredAt
      }
    }
  }
}`.replace(/\s+/g, ' ') // Minify
  const res = await fetch(`https://api.github.com/graphql?stars=${slug}`, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`
    },
    body: JSON.stringify({ query }),
    next: {
      tags: ['github'],
      revalidate: 3600 // 1h
    }
  })
  const {
    data: {
      repository: {
        stargazers: { totalCount, edges }
      }
    }
  } = starHistoryQuerySchema.parse(await res.json())
  const bins = groupStarHistoryByDate(edges)
  bins[0].diff = bins[0].stars
  bins[0].stars = totalCount
  for (let i = 1; i < bins.length; ++i) {
    bins[i].diff = bins[i].stars
    bins[i].stars = bins[i - 1].stars - bins[i - 1].diff
  }
  return {
    count: totalCount,
    bins
  }
}

function groupStarHistoryByDate(
  edges: { starredAt: Date }[]
): GitHubStarHistory['bins'] {
  const bins = new Map<string, number>()
  for (const { starredAt } of edges) {
    const date = starredAt.toISOString().slice(0, 10)
    bins.set(date, (bins.get(date) ?? 0) + 1)
  }
  return Array.from(bins.entries()).map(([date, stars]) => ({
    date: new Date(date),
    stars,
    diff: 0
  }))
}
