#!/usr/bin/env node

import { randomBytes } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import type { Change } from './lib/change.ts'
import {
  breakingChanges,
  CATEGORIES,
  groupChangesByCategory,
  parseCodeSpans,
  renderChangelogComment
} from './lib/changelog-dto.ts'
import { discoverChanges, makeGitHubGraphReader } from './lib/commit-graph.ts'

// The category vocabulary and the change grouping/breaking cross-cut now live in
// the IO-free codec (`lib/changelog-dto.ts`), the SSOT shared with the changelog
// renderer. Re-exported here so existing importers (and the test suite) keep
// their entry point.
export {
  breakingChanges,
  CATEGORIES,
  groupChangesByCategory
} from './lib/changelog-dto.ts'
export type { Category } from './lib/changelog-dto.ts'

export function formatClosingIssues(issues: readonly number[]): string {
  if (issues.length === 0) return ''
  const issueNumbers = issues.map(number => `#${number}`).join(', ')
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
// `abcd1234 - …, by Author Name` (no `@`, no closing issues). With
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
  // Convert backtick code spans to <code> tags for GitHub release notes, via the
  // shared span-parser — so the GitHub notes and the changelog page render the
  // (raw) description identically and cannot drift.
  return parseCodeSpans(title)
    .map(segment =>
      segment.code ? `<code>${segment.value}</code>` : segment.value
    )
    .join('')
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

// Wrap a value in the heredoc envelope GitHub Actions uses for multiline job
// outputs: `name<<DELIM`, the value, then `DELIM` alone on the last line. The
// caller passes an unguessable delimiter because the notes are untrusted text —
// a predictable one could be closed early by a crafted note line to inject
// extra outputs. The collision check turns the (astronomically unlikely) case
// of the value containing the delimiter into a loud failure rather than a
// silent injection. Emitting this from here keeps the `<<` operator out of the
// workflow's shell, where GitHub's blob highlighter mis-reads it as a heredoc.
export function formatMultilineOutput(
  name: string,
  value: string,
  delimiter: string
): string {
  if (value.includes(delimiter)) {
    throw new Error('Refusing to emit output: value contains the delimiter')
  }
  return `${name}<<${delimiter}\n${value}\n${delimiter}\n`
}

async function main(): Promise<void> {
  // Draft phase: the tag does not exist yet, so the range is resolved from
  // HEAD. The channel selects the asymmetric range (incremental beta vs
  // cumulative GA) — the same engine finalize runs post-publish, so the
  // drafted notes list exactly the PRs/issues finalize will comment on.
  const env = createEnv({
    server: {
      CHANNEL: z.enum(['stable', 'beta']),
      GITHUB_TOKEN: z.string().min(1),
      GITHUB_OUTPUT: z.string().optional()
    },
    isServer: true,
    runtimeEnv: process.env
  })
  const release = await discoverChanges({
    channel: env.CHANNEL,
    currentRef: 'HEAD',
    reader: makeGitHubGraphReader(env.GITHUB_TOKEN)
  })
  // The human-readable notes, followed by the machine-readable DTO comment the
  // changelog page reads back (hidden on GitHub + in subscriber emails).
  const notes = renderReleaseNotes(release.changes, release.contributors)
  const body = `${notes}\n\n${renderChangelogComment(release)}`
  // In CI, hand the notes to the draft job as a multiline output; locally,
  // print them for inspection.
  if (env.GITHUB_OUTPUT) {
    const delimiter = `NOTES_EOF_${randomBytes(16).toString('hex')}`
    appendFileSync(
      env.GITHUB_OUTPUT,
      formatMultilineOutput('notes', body, delimiter)
    )
  } else {
    console.log(body)
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}
