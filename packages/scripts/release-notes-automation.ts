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
  breaking: boolean
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
      closingIssues: change.closingIssues,
      breaking: change.breaking
    })
  }

  for (const category of CATEGORIES) {
    categories[category].sort((a, b) => a.number - b.number)
  }

  return categories
}

// The breaking-changes cross-cut: every change flagged `breaking`, ordered by PR
// number. This is a filter over `breaking`, NOT a category — a `feat!` stays in
// Features and also appears here. It drives the top "Breaking changes" section,
// the maintainer's editing surface for the migration guide.
export function breakingChanges(changes: Change[]): Change[] {
  return changes
    .filter(change => change.breaking)
    .sort((a, b) => a.prNumber - b.prNumber)
}

export function formatClosingIssues(
  issues: CategorizedChange['closingIssues']
): string {
  if (issues.length === 0) return ''
  const issueNumbers = issues.map(i => `#${i.number}`).join(', ')
  return ` (closes ${issueNumbers})`
}

// What a single changelog bullet needs: a `CategorizedChange` minus its category
// (a top-section breaking change has no category), so the two stay in lockstep.
type ChangeLine = Omit<CategorizedChange, 'category'>

// Render one changelog bullet. With `decorateBreaking`, a breaking change gets a
// trailing ⚠️ marker — used in the type sections so a `feat!` is flagged inline.
// The top "Breaking changes" section renders undecorated (the whole section is
// already breaking, so a per-line marker would be noise).
export function formatChangeLine(
  change: ChangeLine,
  options: { decorateBreaking?: boolean } = {}
): string {
  const author = change.author ? `, by @${change.author}` : ''
  const closes = formatClosingIssues(change.closingIssues)
  const marker =
    options.decorateBreaking && change.breaking ? ' - ⚠️ breaking change' : ''
  return `- #${change.number} - ${formatTitle(change.description)}${author}${closes}${marker}`
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

// Assemble the full release-notes markdown: the breaking-changes cross-cut
// first (its own section + a migration-guide placeholder for the maintainer to
// fill in), then the type sections (with breaking lines flagged ⚠️), then the
// Thanks section. Empty sections are dropped. Pure: `main` only prints the result.
export function renderReleaseNotes(
  changes: Change[],
  contributors: string[]
): string {
  const blocks: string[] = []

  const breaking = breakingChanges(changes)
  if (breaking.length > 0) {
    const lines = breaking.map(change =>
      formatChangeLine({ ...change, number: change.prNumber })
    )
    blocks.push(
      [
        '## Breaking changes',
        '',
        ...lines,
        '',
        '### Migration guide',
        '',
        '<!-- todo: Add migration steps for breaking changes -->'
      ].join('\n')
    )
  }

  const categories = groupChangesByCategory(changes)
  for (const category of CATEGORIES) {
    const changesInCategory = categories[category]
    if (changesInCategory.length === 0) continue
    const lines = changesInCategory.map(change =>
      formatChangeLine(change, { decorateBreaking: true })
    )
    blocks.push([`## ${category}`, '', ...lines].join('\n'))
  }

  const thanksSection = formatThanksSection(contributors)
  if (thanksSection) {
    blocks.push(['## Thanks', '', thanksSection].join('\n'))
  }

  return blocks.join('\n\n')
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

    console.log(renderReleaseNotes(changes, contributors))
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
