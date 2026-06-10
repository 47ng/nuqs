#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import {
  type Change,
  discoverChanges,
  makeGitHubGraphReader
} from './lib/commit-graph.ts'

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

export type CategorizedChange = {
  category: Category
  number: number
  description: string
  author: string | null
  closingIssues: Array<{ number: number }>
}

// Group changes into their changelog categories. The category is derived from
// the change's `type` (the squash commit's classification) — never the PR
// title, whose prefix is irrelevant prose. Within each category, changes are
// ordered by PR number.
export function groupChangesByCategory(
  changes: Change[]
): Record<Category, CategorizedChange[]> {
  const categories: Record<Category, CategorizedChange[]> = {
    Features: [],
    'Bug fixes': [],
    Documentation: [],
    'Other changes': []
  }

  for (const change of changes) {
    const category = categoryForType(change.type)
    categories[category].push({
      category,
      number: change.prNumber,
      description: change.description,
      author: change.author,
      closingIssues: change.closingIssues
    })
  }

  for (const category of CATEGORIES) {
    categories[category].sort((a, b) => a.number - b.number)
  }

  return categories
}

export function formatClosingIssues(
  issues: CategorizedChange['closingIssues']
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
    const { changes, contributors } = await discoverChanges({
      channel: env.CHANNEL,
      currentRef: 'HEAD',
      reader: makeGitHubGraphReader(env.GITHUB_TOKEN)
    })

    // Group by category
    const categories = groupChangesByCategory(changes)

    // Display results
    for (const category of CATEGORIES) {
      const changesInCategory = categories[category]

      if (changesInCategory.length === 0) {
        continue // Skip empty categories
      }

      console.log(`## ${category}\n`)

      for (const change of changesInCategory) {
        const author = change.author ? `, by @${change.author}` : ''
        const closingIssues = formatClosingIssues(change.closingIssues)
        console.log(
          `- #${change.number} - ${formatTitle(change.description)}${author}${closingIssues}`
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
