#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import {
  type Change,
  discoverChanges,
  type IssueRef,
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

// Order within a section: PR-sourced changes first (ascending PR number), then
// direct-commit changes in their given order (discovery supplies them
// oldest-first). Relies on a stable sort to preserve that commit order.
function compareChanges(a: Change, b: Change): number {
  if (a.source !== b.source) return a.source === 'squashedPR' ? -1 : 1
  if (a.source === 'squashedPR' && b.source === 'squashedPR')
    return a.prNumber - b.prNumber
  return 0
}

// Group changes into their changelog categories. The category is derived from
// the change's `type` (the commit's classification) — never a PR title, whose
// prefix is irrelevant prose. The category is the bucket key, not a field on the
// change, so the two can't drift.
export function groupChangesByCategory(
  changes: Change[]
): Record<Category, Change[]> {
  const categories: Record<Category, Change[]> = {
    Features: [],
    'Bug fixes': [],
    Documentation: [],
    'Other changes': []
  }
  for (const change of changes) {
    categories[categoryForType(change.type)].push(change)
  }
  for (const category of CATEGORIES) {
    categories[category].sort(compareChanges)
  }
  return categories
}

// The breaking-changes cross-cut: every change flagged `breaking`, in the same
// PR-first / commit-oldest order. A filter over `breaking`, NOT a category — a
// `feat!` stays in its type section and also appears here. Drives the top
// "Breaking changes" section, the maintainer's editing surface for the guide.
export function breakingChanges(changes: Change[]): Change[] {
  return changes.filter(change => change.breaking).sort(compareChanges)
}

export function formatClosingIssues(issues: readonly IssueRef[]): string {
  if (issues.length === 0) return ''
  const issueNumbers = issues.map(i => `#${i.number}`).join(', ')
  return ` (closes ${issueNumbers})`
}

// A PR's author is a GitHub login, rendered `@handle`; a direct commit's is a
// git author name, rendered as-is. Either may be absent (a deleted GitHub
// account resolves to null), in which case the attribution is omitted.
function formatAuthor(change: Change): string {
  if (!change.author) return ''
  const handle =
    change.source === 'squashedPR' ? `@${change.author}` : change.author
  return `, by ${handle}`
}

// Render one changelog bullet. A PR-sourced change renders as
// `#123 - …, by @login (closes #N)`; a direct-commit change as
// `abcd1234 - …, by Committer Name` (no `@`, no closing issues). With
// `decorateBreaking`, a breaking change gets a trailing ⚠️ marker — used in the
// type sections so a `feat!` is flagged inline; the top "Breaking changes"
// section renders undecorated (the whole section is already breaking).
export function formatChangeLine(
  change: Change,
  options: { decorateBreaking?: boolean } = {}
): string {
  const ref =
    change.source === 'squashedPR' ? `#${change.prNumber}` : change.sha
  const author = formatAuthor(change)
  const closes =
    change.source === 'squashedPR'
      ? formatClosingIssues(change.closingIssues)
      : ''
  const marker =
    options.decorateBreaking && change.breaking ? ' - ⚠️ breaking change' : ''
  return `- ${ref} - ${formatTitle(change.description)}${author}${closes}${marker}`
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
    const lines = breaking.map(change => formatChangeLine(change))
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
