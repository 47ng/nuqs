#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import {
  discoverRelease,
  makeGitHubGraphReader,
  type PR
} from './lib/commit-graph.ts'
import { classify } from './lib/conventional-commits.ts'

export const CATEGORIES = [
  'Features',
  'Bug fixes',
  'Documentation',
  'Other changes'
] as const
export type Category = (typeof CATEGORIES)[number]

function categoryForType(type: string | undefined): Category {
  switch (type) {
    case 'feat':
      return 'Features'
    case 'fix':
      return 'Bug fixes'
    case 'doc':
    case 'docs':
      return 'Documentation'
    default:
      return 'Other changes'
  }
}

export function splitCategoryTitle(title: string): [Category, string] {
  // Note: classify is case-sensitive, so commits that haven't been
  // linted by commitlint (e.g. a "Feat: whatever" from the GitHub web UI)
  // will be categorised as "Other changes".
  const { type, description } = classify(title)
  return [categoryForType(type), description]
}

export type CategorizedPR = {
  category: Category
  number: number
  title: string
  author: string | null
  closingIssues: Array<{ number: number }>
}

export function groupPRsByCategory(
  prs: PR[]
): Record<Category, CategorizedPR[]> {
  const categories: Record<Category, CategorizedPR[]> = {
    Features: [],
    'Bug fixes': [],
    Documentation: [],
    'Other changes': []
  }

  for (const pr of prs) {
    const [category, cleanTitle] = splitCategoryTitle(pr.title)
    const closingIssues = pr.closingIssuesReferences.edges.map(edge => ({
      number: edge.node.number
    }))
    categories[category].push({
      category,
      number: pr.number,
      title: cleanTitle,
      author: pr.author?.login ?? null,
      closingIssues
    })
  }

  for (const category of CATEGORIES) {
    categories[category].sort((a, b) => a.number - b.number)
  }

  return categories
}

export function formatClosingIssues(
  issues: CategorizedPR['closingIssues']
): string {
  if (issues.length === 0) return ''
  const issueNumbers = issues.map(i => `#${i.number}`).join(', ')
  return ` (closes ${issueNumbers})`
}

export function formatTitle(title: string): string {
  // Convert backtick code blocks to <code> tags for better rendering in GitHub release notes
  return title.replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function formatThanksSection(contributors: string[]): string | null {
  if (contributors.length === 0) {
    return null
  }
  // Such travesty will not go unpunished! 🇬🇧
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#oxford_comma
  const oxfordComma = new Intl.ListFormat('en-US', { type: 'conjunction' })
  const allContributors = oxfordComma.format(contributors.map(c => `@${c}`))
  return `Huge thanks to ${allContributors} for helping!`
}

// Main execution
async function main() {
  try {
    // Draft phase: the tag does not exist yet, so the range is resolved from
    // HEAD. The channel selects the asymmetric range (incremental beta vs
    // cumulative GA) — the same engine finalize runs post-publish, so the
    // drafted notes list exactly the PRs/issues finalize will comment on.
    const env = createEnv({
      server: {
        CHANNEL: z.enum(['stable', 'beta']),
        GITHUB_TOKEN: z.string().min(1)
      },
      isServer: true,
      runtimeEnv: process.env
    })
    const { prs, contributors } = await discoverRelease({
      channel: env.CHANNEL,
      currentRef: 'HEAD',
      reader: makeGitHubGraphReader(env.GITHUB_TOKEN)
    })

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
        console.log(
          `- #${pr.number} - ${formatTitle(pr.title)}${author}${closingIssues}`
        )
      }

      console.log() // Empty line between categories
    }

    // Display contributors
    const thanksSection = formatThanksSection(contributors)
    if (thanksSection) {
      console.log('## Thanks\n')
      console.log(`${thanksSection}\n`)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
