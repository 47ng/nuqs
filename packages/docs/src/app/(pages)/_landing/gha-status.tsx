import { cn } from '@/src/lib/utils'
import React from 'react'
import { z } from 'zod'

const runDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC'
})

export async function GitHubActionsStatus({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  const statuses = await getGitHubActionsStatus()
  if (statuses.length === 0) {
    return null
  }
  return (
    <ul
      className={cn('flex items-center gap-1', className)}
      aria-label={`Last ${statuses.length} GitHub Actions ${statuses.length === 1 ? 'status' : 'statuses'}`}
      {...props}
    >
      {statuses.map((status, index) => {
        const metadata = {
          SUCCESS: { color: 'bg-green-500', label: 'success' },
          FAILURE: { color: 'bg-red-500', label: 'failure' },
          CANCELLED: { color: 'bg-zinc-500', label: 'cancelled' },
          TIMED_OUT: { color: 'bg-zinc-500', label: 'timed out' },
          ACTION_REQUIRED: {
            color: 'bg-purple-500',
            label: 'action required'
          },
          NEUTRAL: { color: 'bg-zinc-500', label: 'neutral' }
        }[status.checkSuite.conclusion]
        return (
          <li key={status.id}>
            <a
              href={status.url}
              aria-label={`GitHub Actions run ${index + 1} of ${statuses.length}, most recent first, on ${runDateFormat.format(new Date(status.createdAt))}: ${metadata.label}`}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <div
                aria-hidden="true"
                className={cn(
                  'border-background h-4 w-4 rounded-full border-2 bg-current md:h-5 md:w-5',
                  metadata.color
                )}
              />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

const ghaStatusSchema = z.object({
  id: z.string(),
  url: z.url(),
  createdAt: z.iso.datetime(),
  checkSuite: z.object({
    status: z.literal('COMPLETED'),
    conclusion: z.enum([
      'SUCCESS',
      'FAILURE',
      'CANCELLED',
      'TIMED_OUT',
      'ACTION_REQUIRED',
      'NEUTRAL'
    ])
  })
})

export async function getGitHubActionsStatus() {
  // The GraphQL API rejects unauthenticated requests
  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      'GITHUB_TOKEN is not set: GitHub Actions status is unavailable.'
    )
    return []
  }
  // Fetch a few more than needed to filter out non-completed runs
  const query = `query {
    node(id: "W_kwDOD6wJuM4EeKz5") {
      ... on Workflow {
        runs(first: 8, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id
            url
            createdAt
            checkSuite {
              status
              conclusion
            }
          }
        }
      }
    }
  }`.replace(/\s+/g, ' ') // Minify
  let debugInfo: any = undefined
  try {
    const json = await fetch(
      `https://api.github.com/graphql?fn=getGitHubActionsStatus`,
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${process.env.GITHUB_TOKEN}`
        },
        body: JSON.stringify({ query }),
        next: {
          tags: ['github-actions-status']
        }
      }
    ).then(res => res.json())
    debugInfo = json

    // Filter for completed runs only
    return z
      .array(z.unknown())
      .parse(json.data.node.runs.nodes)
      .reduce<z.infer<typeof ghaStatusSchema>[]>((runs, run) => {
        const result = ghaStatusSchema.safeParse(run)
        if (result.success) {
          runs.push(result.data)
        }
        return runs
      }, [])
      .slice(0, 5) // Take only the last 5 completed runs
      .reverse() // Order from oldest to newest
  } catch (error) {
    console.error(error, JSON.stringify(debugInfo))
    return []
  }
}
