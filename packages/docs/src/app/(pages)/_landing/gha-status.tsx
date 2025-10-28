import { cn } from '@/src/lib/utils'
import React from 'react'
import { z } from 'zod'

export async function GitHubActionsStatus({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const statuses = await getGitHubActionsStatus()
  if (statuses.length === 0) {
    return null
  }
  return (
    <div
      className={cn(
        'flex items-center space-x-[-12px] md:space-x-[-14px]',
        className
      )}
      aria-label="Last 5 GitHub Actions status"
      {...props}
    >
      {statuses.map(status => {
        const color = {
          SUCCESS: 'bg-green-500',
          FAILURE: 'bg-red-500',
          CANCELLED: 'bg-zinc-500',
          TIMED_OUT: 'bg-zinc-500',
          ACTION_REQUIRED: 'bg-purple-500',
          NEUTRAL: 'bg-zinc-500'
        }[status.checkSuite.conclusion]
        return (
          <a key={status.id} href={status.url} className="rounded-full p-1">
            <div
              aria-label={status.checkSuite.conclusion}
              className={cn(
                'border-background h-4 w-4 rounded-full border-2 bg-current md:h-5 md:w-5',
                color
              )}
            />
          </a>
        )
      })}
    </div>
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

async function getGitHubActionsStatus() {
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
    const json = await fetch(`https://api.github.com/graphql?repo=47ng/nuqs`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query }),
      next: {
        tags: ['github-actions-status']
      }
    }).then(res => res.json())
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
