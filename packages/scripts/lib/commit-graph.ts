// Shared commit-graph discovery engine.
//
// The single source of truth both release phases consume, split per phase over
// one shared range → PR-number core (`changeRefsInRange`):
//   - Phase 1 (draft notes, `release-notes-automation.ts`) → `discoverChanges`:
//     fetches the full pull-request fields (title, author, closing issues,
//     participants) the changelog lines and the Thanks section render.
//   - Phase 2 (finalize comments, `release-finalize.ts`) → `discoverTargets`:
//     fetches only each pull request's closing issue numbers (the comment
//     targets), not the title/author/participants it would never render.
// The work runs twice — once at draft time (currentRef = HEAD, tag not yet
// created) and once at finalize time (currentRef = the just-published tag, on
// the same drafted HEAD). Both paths share the range core (same PRs) and
// resolve closing issues from the same field over the same numbers (same
// issues), so the drafted notes always list exactly what finalize comments on;
// only the extra notes-only fields differ between them.
//
// Pure core (range resolution, PR-number extraction, channel detection,
// contributor collection) is unit-tested, and both discovery paths are tested
// through an injected `ReleaseGraphReader`; the production reader (git log,
// GitHub GraphQL) is thin glue and untested by design.

import { z } from 'zod'
import type { Channel } from '../compute-version.ts'
import { parseCommit, parseSubject } from './conventional-commits.ts'
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

// What the finalize path fetches per pull request: its number and its closing
// issue numbers, nothing else. The title, author, and participant nodes the
// notes path renders are omitted — finalize never reads them (and the
// participant nodes are the bulk of the payload).
export const prClosingIssuesSchema = z.object({
  number: z.number(),
  closingIssuesReferences: z.object({
    edges: z.array(z.object({ node: z.object({ number: z.number() }) }))
  })
})

export type PRClosingIssues = z.infer<typeof prClosingIssuesSchema>

// A change: the atomic unit of a release, one squash commit joined to its PR.
// `type` comes from the squash commit subject (the classification authority);
// `description` is the PR title as prose (its type prefix stripped for display,
// never classified). The notes phase renders changes; finalize needs only
// `prNumber`.
export type Change = {
  prNumber: number
  type: string | undefined
  breaking: boolean
  description: string
  author: string | null
  closingIssues: Array<{ number: number }>
}

// The notes-path output: the full `changes` driving the changelog, plus the
// release `contributors` feeding the "Thanks" section.
export type ReleaseChanges = {
  changes: Change[]
  contributors: string[]
}

// The finalize-path output: the comment targets, split into the release's PRs
// (`changes`, by number) and their deduplicated closing `issues`. Finalize
// comments on both.
export type ReleaseTargets = {
  changes: Array<{ prNumber: number }>
  issues: Array<{ number: number }>
}

// --- Reader port -----------------------------------------------------------

// The IO surface both discovery paths consume. Production uses
// `makeGitHubGraphReader` (git + GitHub GraphQL); tests inject an in-memory
// reader built from plain data. The two PR fetchers are segregated so each
// phase fetches only the fields it renders: `fetchChangeDetails` pulls the full
// pull-request fields for the notes, `fetchClosingIssues` only the closing
// issue numbers finalize comments on.
export type ReleaseGraphReader = {
  readTags: () => string[]
  readCommits: (range: Range) => string[]
  fetchChangeDetails: (numbers: number[]) => Promise<PR[]>
  fetchClosingIssues: (numbers: number[]) => Promise<PRClosingIssues[]>
}

export function makeGitHubGraphReader(githubToken: string): ReleaseGraphReader {
  return {
    readTags: readAllTags,
    readCommits,
    fetchChangeDetails: numbers => fetchChangeDetails(numbers, githubToken),
    fetchClosingIssues: numbers => fetchClosingIssues(numbers, githubToken)
  }
}

// --- IO shell (untested by design) ----------------------------------------

// Full commit messages (subject + body, %B) for a range, one record per commit.
// The body is needed so a `BREAKING CHANGE:` footer (which lives below the
// subject) is detected. Records are split on \x1e, which cannot occur in a
// message. Messages reach the parser only through git's stdout (no shell), so a
// crafted message cannot inject commands.
function readCommits(range: Range): string[] {
  const spec = range.from ? `${range.from}..${range.to}` : range.to
  return git(['log', spec, '--format=%B%x1e'])
    .split('\x1e')
    .map(record => record.trim())
    .filter(Boolean)
}

// One batched, aliased GraphQL query selecting `selection` on every PR by
// number, validated per node by `nodeSchema`. Squash-merge means PR numbers
// come straight from commit subjects, so no per-commit `associatedPullRequests`
// lookup is needed. `fnLabel` only tags the request URL for observability.
async function fetchPRNodes<T>(args: {
  prNumbers: number[]
  githubToken: string
  fnLabel: string
  selection: string
  nodeSchema: z.ZodType<T>
}): Promise<T[]> {
  const { prNumbers, githubToken, fnLabel, selection, nodeSchema } = args
  const aliases = prNumbers
    .map(
      number => `
      pr${number}: pullRequest(number: ${number}) {
        ${selection}
      }`
    )
    .join('\n')
  const query = `query { repository(owner: "47ng", name: "nuqs") { ${aliases} } }`

  const response = await fetch(`https://api.github.com/graphql?fn=${fnLabel}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    )
  }
  const responseSchema = z.object({
    data: z.object({
      repository: z.record(z.string(), nodeSchema.nullable())
    })
  })
  const parsed = responseSchema.parse(await response.json())
  // A null node means the PR number resolved to nothing (e.g. a transferred
  // issue); drop it rather than failing the whole release.
  return Object.values(parsed.data.repository).filter(
    (node): node is T => node !== null
  )
}

// Notes path: every PR with its title, author, closing issues, and participants
// (the participant nodes dominate the payload, but the Thanks section needs
// them).
function fetchChangeDetails(
  prNumbers: number[],
  githubToken: string
): Promise<PR[]> {
  return fetchPRNodes({
    prNumbers,
    githubToken,
    fnLabel: 'fetchChangeDetails',
    selection: `
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
        }`,
    nodeSchema: prSchema
  })
}

// Finalize path: every PR with only its closing issue numbers — no title,
// author, or participant nodes (the fields finalize never reads).
function fetchClosingIssues(
  prNumbers: number[],
  githubToken: string
): Promise<PRClosingIssues[]> {
  return fetchPRNodes({
    prNumbers,
    githubToken,
    fnLabel: 'fetchClosingIssues',
    selection: `
        number
        closingIssuesReferences(first: 10) {
          edges {
            node {
              number
            }
          }
        }`,
    nodeSchema: prClosingIssuesSchema
  })
}

// The closing-issues facet shared by `PR` and `PRClosingIssues`, so
// `collectIssues` serves both discovery paths from the same field.
type WithClosingIssues = {
  closingIssuesReferences: { edges: Array<{ node: { number: number } }> }
}

// Deduplicate closing issues across all PRs (a single issue can be closed by
// more than one PR across the range).
export function collectIssues(
  prs: WithClosingIssues[]
): Array<{ number: number }> {
  const numbers = new Set<number>()
  for (const pr of prs) {
    for (const { node } of pr.closingIssuesReferences.edges) {
      numbers.add(node.number)
    }
  }
  return [...numbers].map(number => ({ number }))
}

// The squash commit's classification for a PR: its conventional `type` and
// whether it is `breaking`. Both come from the commit message, the
// classification authority — the PR title is never consulted.
type Classification = { type: string | undefined; breaking: boolean }

// Map each PR number appearing in the range to its squash commit's
// classification, first-seen winning (a `(#N)` may recur across commits; the
// first occurrence is authoritative). `extractPRNumber` reads the first line
// (the squash suffix), `parseCommit` the whole message — so a break flagged only
// by a `BREAKING CHANGE:` body footer (no subject `!`) is still detected.
function changeTypeByPR(records: string[]): Map<number, Classification> {
  const types = new Map<number, Classification>()
  for (const record of records) {
    const firstLine = record.split('\n')[0] ?? ''
    const number = extractPRNumber(firstLine)
    if (number !== null && !types.has(number)) {
      const { type, breaking } = parseCommit(record)
      types.set(number, { type, breaking })
    }
  }
  return types
}

// Project a fetched PR into a change: `type`/`breaking` from the squash commit
// (via `typeByPR`), `description` from the PR title as prose (its type prefix
// stripped for display, never classified).
function toChange(pr: PR, typeByPR: Map<number, Classification>): Change {
  const { type, breaking } = typeByPR.get(pr.number) ?? {
    type: undefined,
    breaking: false
  }
  return {
    prNumber: pr.number,
    type,
    breaking,
    description: parseSubject(pr.title).description,
    author: pr.author?.login ?? null,
    closingIssues: pr.closingIssuesReferences.edges.map(edge => ({
      number: edge.node.number
    }))
  }
}

// A change reference: the identity + classification both phases derive for free
// from the squash commit messages alone (no GraphQL). The shared discovery core.
export type ChangeRef = {
  prNumber: number
  type: string | undefined
  breaking: boolean
}

// The shared range → PR-number core both phases build on. Resolve the
// channel-asymmetric range, read its commit messages (the type authority), and
// project each referenced PR to its `{ prNumber, type, breaking }`. This is the
// SSOT: the identical PR set feeds whichever phase-specific fetch follows.
export function changeRefsInRange(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): ChangeRef[] {
  const { reader } = args
  const range = resolveRange({ ...args, tags: reader.readTags() })
  const typeByPR = changeTypeByPR(reader.readCommits(range))
  return [...typeByPR].map(([prNumber, { type, breaking }]) => ({
    prNumber,
    type,
    breaking
  }))
}

// Notes-path discovery: the shared core + `fetchChangeDetails`, projected into
// the full change aggregate (type from the commit, the rest from the PR) plus
// the release contributors. `fetchClosingIssues` is never touched.
export async function discoverChanges(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): Promise<ReleaseChanges> {
  const { reader } = args
  const refs = changeRefsInRange(args)
  if (refs.length === 0) {
    return { changes: [], contributors: [] }
  }
  const typeByPR = new Map(
    refs.map(({ prNumber, type, breaking }) => [prNumber, { type, breaking }])
  )
  const prs = await reader.fetchChangeDetails(refs.map(ref => ref.prNumber))
  return {
    changes: prs.map(pr => toChange(pr, typeByPR)),
    contributors: collectContributors(prs)
  }
}

// Finalize-path discovery: the shared core + `fetchClosingIssues`, projected
// into comment targets — the release's PRs (by number) and their deduplicated
// closing issues. `fetchChangeDetails` is never touched. The PRs come from the
// fetched (surviving) nodes, so a `(#N)` that resolves to nothing is dropped
// from the targets exactly as it is from the notes.
export async function discoverTargets(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): Promise<ReleaseTargets> {
  const { reader } = args
  const refs = changeRefsInRange(args)
  if (refs.length === 0) {
    return { changes: [], issues: [] }
  }
  const prs = await reader.fetchClosingIssues(refs.map(ref => ref.prNumber))
  return {
    changes: prs.map(pr => ({ prNumber: pr.number })),
    issues: collectIssues(prs)
  }
}
