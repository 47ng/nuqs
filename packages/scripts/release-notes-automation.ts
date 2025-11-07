#!/usr/bin/env node

import { z } from 'zod'

// Schema for the GraphQL response
const issueReferenceSchema = z.object({
  number: z.number(),
  author: z
    .object({
      login: z.string()
    })
    .nullable()
})

const prSchema = z.object({
  number: z.number(),
  title: z.string(),
  author: z
    .object({
      login: z.string()
    })
    .nullable(),
  closingIssuesReferences: z.object({
    edges: z.array(
      z.object({
        node: issueReferenceSchema
      })
    )
  })
})

const responseSchema = z.object({
  data: z.object({
    repository: z.object({
      milestone: z
        .object({
          pullRequests: z.object({
            nodes: z.array(prSchema)
          })
        })
        .nullable()
    })
  })
})

type PR = z.infer<typeof prSchema>

const CATEGORIES = [
  'Features',
  'Bug fixes',
  'Documentation',
  'Other changes'
] as const
type Category = (typeof CATEGORIES)[number]

async function fetchMilestonePRs(): Promise<PR[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required')
  }

  // GraphQL query to fetch PRs with milestone ID 2 and their closing issues
  const query = `
    query {
      repository(owner: "47ng", name: "nuqs") {
        milestone(number: 2) {
          pullRequests(first: 100) {
            nodes {
              number
              title
              author {
                login
              }
              closingIssuesReferences(first: 10) {
                edges {
                  node {
                    number
                    author {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `.replace(/\s+/g, ' ')

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    )
  }

  const json = await response.json()
  const parsed = responseSchema.parse(json)

  if (!parsed.data.repository.milestone) {
    throw new Error('Milestone not found')
  }

  return parsed.data.repository.milestone.pullRequests.nodes
}

function splitCategoryTitle(title: string): [Category, string] {
  // Regex to match conventional commit prefix with optional scope
  // Matches: feat:, feat(scope):, fix:, docs:, doc:, etc.
  const conventionalCommitRegex = /^(\w+)(?:\([^)]+\))?:\s*(.+)$/
  const match = title.match(conventionalCommitRegex)

  let category: Category
  let cleanTitle: string

  if (match) {
    const [, type = '', titleWithoutPrefix = ''] = match
    cleanTitle = titleWithoutPrefix.trim()

    const typeLower = type.toLowerCase()

    if (typeLower === 'feat') {
      category = 'Features'
    } else if (typeLower === 'fix') {
      category = 'Bug fixes'
    } else if (typeLower === 'doc' || typeLower === 'docs') {
      category = 'Documentation'
    } else {
      category = 'Other changes'
    }
  } else {
    // No conventional commit prefix found
    category = 'Other changes'
    cleanTitle = title
  }
  return [category, cleanTitle] as const
}

type CategorizedPR = {
  category: Category
  number: number
  title: string
  author: string | null
  closingIssues: Array<{ number: number; author: string | null }>
}

function groupPRsByCategory(prs: PR[]): Record<Category, CategorizedPR[]> {
  const categories: Record<Category, CategorizedPR[]> = {
    Features: [],
    'Bug fixes': [],
    Documentation: [],
    'Other changes': []
  }

  for (const pr of prs) {
    const [category, cleanTitle] = splitCategoryTitle(pr.title)
    const closingIssues = pr.closingIssuesReferences.edges.map(edge => ({
      number: edge.node.number,
      author: edge.node.author?.login ?? null
    }))
    categories[category].push({
      category,
      number: pr.number,
      title: cleanTitle,
      author: pr.author?.login ?? null,
      closingIssues
    })
    categories[category].sort((a, b) => a.number - b.number)
  }

  return categories
}

function collectContributors(prs: PR[]): string[] {
  const contributors = new Set<string>()

  // Known bot accounts to exclude
  const botAccounts = new Set([
    'franky47', // I'm not a bot, but exclude myself from the thanks part.
    'dependabot',
    'dependabot[bot]',
    'github-actions',
    'github-actions[bot]',
    'renovate',
    'renovate[bot]'
  ])

  for (const pr of prs) {
    // Add PR author
    if (pr.author?.login && !botAccounts.has(pr.author.login)) {
      contributors.add(pr.author.login)
    }

    // Add authors of closing issues
    for (const { node } of pr.closingIssuesReferences.edges) {
      if (node.author?.login && !botAccounts.has(node.author.login)) {
        contributors.add(node.author.login)
      }
    }
  }

  return Array.from(contributors).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )
}

function formatClosingIssues(issues: CategorizedPR['closingIssues']): string {
  if (issues.length === 0) return ''
  const issueNumbers = issues.map(i => `#${i.number}`).join(', ')
  return ` (closes ${issueNumbers})`
}

// Main execution
async function main() {
  try {
    const prs = await fetchMilestonePRs()

    // Group by category
    const categories = groupPRsByCategory(prs)

    // Display results
    for (const category of CATEGORIES) {
      const prsInCategory = categories[category]

      if (prsInCategory.length === 0) {
        continue // Skip empty categories
      }

      console.log(`## ${category}\n`)

      for (const pr of prsInCategory) {
        const author = pr.author ? `, by @${pr.author}` : ''
        const closingIssues = formatClosingIssues(pr.closingIssues)
        console.log(`- #${pr.number} - ${pr.title}${author}${closingIssues}`)
      }

      console.log() // Empty line between categories
    }

    // Collect and display contributors
    const contributors = collectContributors(prs)
    // Such travesty will not go unpunished! 🇬🇧
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#oxford_comma
    const oxfordComma = new Intl.ListFormat('en-US', { type: 'conjunction' })
    const allContributors = oxfordComma.format(contributors.map(c => `@${c}`))

    console.log('## Thanks\n')
    console.log(`Huge thanks to ${allContributors} for helping!\n`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
