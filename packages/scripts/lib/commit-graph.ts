// Shared commit-graph discovery engine.
//
// The single source of truth both release phases consume: Phase 1 (draft
// notes, `release-notes-automation.ts`) and Phase 2 (finalize comments). The
// work runs twice — once at draft time (currentRef = HEAD, tag not yet
// created) and once at finalize time (currentRef = the just-published tag, on
// the same drafted HEAD) — but the logic is identical, so the drafted notes
// always list exactly the issues/PRs finalize comments on.
//
// Pure core (range resolution, PR-number extraction, channel detection,
// contributor collection) is unit-tested; the IO shell (git log, octokit
// GraphQL) is thin glue over it and untested by design.

import { z } from 'zod'
import type { Channel } from '../compute-version.ts'
import { git, readAllTags } from './git.ts'
import { greatestTag, isGA, isValidSemver, precedes } from './version.ts'

// --- Pure core: channel detection -----------------------------------------

// A GA tag is stable; a tag with a prerelease segment (`-beta.N`) is a beta.
// `HEAD` has no version, so the channel is supplied explicitly in the draft
// phase — this is only used at finalize time on a real tag.
export function resolveChannel(ref: string): Channel {
  return isGA(ref) ? 'stable' : 'beta'
}

// --- Pure core: range resolution ------------------------------------------

// The git range `(from, to]` to walk for a release. `from` is null for the
// first-ever release (walk from the beginning of history).
export type Range = { from: string | null; to: string }

// Resolve the commit range a release covers, asymmetric by channel:
//   - GA `vX`      → (previous GA tag, this]      cumulative; betas skipped.
//   - beta `vX-..` → (greatest published tag, this]  incremental delta.
// The tag graph is the announcement ledger: tags exist only for *published*
// releases, so a staged-then-rejected beta leaves no checkpoint and its PRs
// fold into the next published release (self-healing).
//
// `currentRef` is either a tag (finalize: the just-published tag, present in
// `tags`) or the literal `HEAD` (draft: the tag does not exist yet, and HEAD
// sits above every tag). The checkpoint is the semver-greatest candidate
// strictly below `currentRef` — for GA, only GA tags are candidates (so
// intervening betas are skipped); for beta, every published tag qualifies.
export function resolveRange(args: {
  channel: Channel
  currentRef: string
  tags: string[]
}): Range {
  const { channel, currentRef, tags } = args
  const candidates = tags.filter(tag =>
    channel === 'stable' ? isGA(tag) : isValidSemver(tag)
  )
  // HEAD is above every tag, so every candidate is "below" it; a real tag is
  // compared by semver precedence (which also excludes the tag itself).
  const below =
    currentRef === 'HEAD'
      ? candidates
      : candidates.filter(tag => precedes(tag, currentRef))
  return { from: greatestTag(below), to: currentRef }
}

// --- Pure core: PR-number extraction --------------------------------------

// Squash-merge appends ` (#N)` to the commit subject. Match the last such
// suffix (the GitHub-appended PR number) so a `(#N)` mentioned earlier in the
// title can't shadow it. Direct pushes have no `(#N)` and yield null.
export function extractPRNumber(subject: string): number | null {
  const matches = [...subject.matchAll(/\(#(\d+)\)/g)]
  const last = matches.at(-1)
  return last ? Number(last[1]) : null
}

// Collect the deduplicated PR numbers from a list of commit subjects, in first
// -seen order. Subjects without a `(#N)` (direct pushes) are ignored.
export function extractPRNumbers(subjects: string[]): number[] {
  const seen = new Set<number>()
  for (const subject of subjects) {
    const number = extractPRNumber(subject)
    if (number !== null) seen.add(number)
  }
  return [...seen]
}

// --- Pure core: contributors ----------------------------------------------

// Known bot accounts to exclude from the "Thanks" section.
const botAccounts = new Set([
  'copilot',
  'dependabot',
  'github-actions',
  'pkg-pr-new',
  'renovate',
  'vercel'
])

export function isBot(login: string): boolean {
  return login.endsWith('[bot]') || botAccounts.has(login.toLowerCase())
}

// Every human who participated in the release's PRs or their closing issues
// (the PR author is included as a participant), sorted case-insensitively,
// with bots and the maintainer (franky47) removed.
export function collectContributors(prs: PR[]): string[] {
  const contributors = new Set<string>()
  for (const pr of prs) {
    for (const { login } of pr.participants.nodes) {
      if (!isBot(login)) contributors.add(login)
    }
    for (const { node } of pr.closingIssuesReferences.edges) {
      for (const { login } of node.participants.nodes) {
        if (!isBot(login)) contributors.add(login)
      }
    }
  }
  contributors.delete('franky47')
  return [...contributors].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )
}

// --- GraphQL schema -------------------------------------------------------

const participantsSchema = z.object({
  nodes: z.array(z.object({ login: z.string() }))
})

const issueReferenceSchema = z.object({
  number: z.number(),
  participants: participantsSchema
})

export const prSchema = z.object({
  number: z.number(),
  title: z.string(),
  author: z.object({ login: z.string() }).nullable(),
  participants: participantsSchema,
  closingIssuesReferences: z.object({
    edges: z.array(z.object({ node: issueReferenceSchema }))
  })
})

export type PR = z.infer<typeof prSchema>

// The full discovery output. `prs` drive the changelog/comments; `issues` are
// their (deduplicated) closing issues to also comment on; `contributors` feed
// the "Thanks" section. Finalize uses prs ∪ issues; notes uses prs +
// contributors.
export type ReleaseData = {
  prs: PR[]
  issues: Array<{ number: number }>
  contributors: string[]
}

// --- IO shell (untested by design) ----------------------------------------

// Commit subjects (first line, %s) for a range. Subjects reach the parser only
// through git's stdout (no shell), so a crafted subject cannot inject commands.
function readSubjects(range: Range): string[] {
  const spec = range.from ? `${range.from}..${range.to}` : range.to
  return git(['log', spec, '--format=%s'])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

const responseSchema = z.object({
  data: z.object({
    repository: z.record(z.string(), prSchema.nullable())
  })
})

// One batched, aliased GraphQL query fetching every PR (and its closing issues
// + participants) by number. Squash-merge means PR numbers come straight from
// commit subjects, so no per-commit `associatedPullRequests` lookup is needed.
async function fetchPullRequests(prNumbers: number[]): Promise<PR[]> {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required')
  }
  const aliases = prNumbers
    .map(
      number => `
      pr${number}: pullRequest(number: ${number}) {
        number
        title
        author { login }
        participants(first: 20) { nodes { login } }
        closingIssuesReferences(first: 10) {
          edges {
            node {
              number
              participants(first: 20) { nodes { login } }
            }
          }
        }
      }`
    )
    .join('\n')
  const query = `query { repository(owner: "47ng", name: "nuqs") { ${aliases} } }`

  const response = await fetch(
    'https://api.github.com/graphql?fn=fetchPullRequests',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    }
  )
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    )
  }
  const parsed = responseSchema.parse(await response.json())
  // A null node means the PR number resolved to nothing (e.g. a transferred
  // issue); drop it rather than failing the whole release.
  return Object.values(parsed.data.repository).filter(
    (pr): pr is PR => pr !== null
  )
}

// Deduplicate closing issues across all PRs (a single issue can be closed by
// more than one PR across the range).
export function collectIssues(prs: PR[]): Array<{ number: number }> {
  const numbers = new Set<number>()
  for (const pr of prs) {
    for (const { node } of pr.closingIssuesReferences.edges) {
      numbers.add(node.number)
    }
  }
  return [...numbers].map(number => ({ number }))
}

// End-to-end discovery for one release: resolve the range, extract PR numbers
// from the commit subjects in it, batch-fetch them, and derive issues +
// contributors. Both phases call this with the same logic.
export async function discoverRelease(args: {
  channel: Channel
  currentRef: string
}): Promise<ReleaseData> {
  const range = resolveRange({ ...args, tags: readAllTags() })
  const prNumbers = extractPRNumbers(readSubjects(range))
  if (prNumbers.length === 0) {
    return { prs: [], issues: [], contributors: [] }
  }
  const prs = await fetchPullRequests(prNumbers)
  return {
    prs,
    issues: collectIssues(prs),
    contributors: collectContributors(prs)
  }
}
