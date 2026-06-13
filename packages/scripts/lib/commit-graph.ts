// Shared commit-graph discovery engine.
//
// The single source of truth both release phases consume, split per phase over
// one shared range → parsed-commits core (`parseRange`):
//   - Phase 1 (draft notes, `release-notes-automation.ts`) → `discoverChanges`:
//     fetches the full pull-request fields (title, author, closing issues,
//     participants) the changelog lines and the Thanks section render, and adds
//     the direct (no-PR) commits, which need no fetch.
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
import {
  parseCommit,
  parseSubject,
  type ParsedSubject
} from './conventional-commits.ts'
import { git, readAllTags } from './git.ts'
import {
  greatestTag,
  isBeta,
  isGA,
  isValidSemver,
  precedes
} from './version.ts'

// --- Pure core: channel detection -----------------------------------------

// A GA tag (vX.Y.Z) is the stable channel; a vX.Y.Z-beta.N tag is the beta
// channel. Any other ref — a non-beta prerelease (`-rc`/`-alpha`), a malformed
// `-beta`, or junk — throws, so a bad finalize TAG aborts the release rather than
// silently publishing to @beta. `HEAD` has no version, so the draft phase
// supplies the channel explicitly; this derivation runs only at finalize, on a
// real tag.
export function resolveChannel(ref: string): Channel {
  if (isGA(ref)) return 'stable'
  if (isBeta(ref)) return 'beta'
  throw new Error(
    `resolveChannel: "${ref}" is neither a GA (vX.Y.Z) nor a beta (vX.Y.Z-beta.N) tag`
  )
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

// A closing-issue reference: the GitHub issue number a PR closes.
export type IssueRef = { readonly number: number }

// A change: the atomic unit of a release. It is sourced either from a squashed
// pull request (the common case) or from a direct commit with no PR:
//   - `squashedPR`   → identity is the PR number, `description` is the PR title
//                       as prose, `author` is the GitHub login, and it carries
//                       closing issues. Rendered as `#123 - …, by @login`.
//   - `directCommit` → identity is the 8-char commit SHA, `description` is the
//                       commit subject as prose, `author` is the git author
//                       name. Rendered as `abcd1234 - …, by Name`.
// In both, the `type`/`breaking` classification comes from the commit message,
// never a PR title. Finalize comments only on `squashedPR` changes (a direct
// commit has no PR/issue).
export type PRChange = {
  readonly source: 'squashedPR'
  readonly prNumber: number
  readonly type: string | undefined
  readonly breaking: boolean
  readonly description: string
  readonly author: string | null
  readonly closingIssues: readonly IssueRef[]
}
export type CommitChange = {
  readonly source: 'directCommit'
  readonly sha: string
  readonly type: string | undefined
  readonly breaking: boolean
  readonly description: string
  readonly author: string
}
export type Change = PRChange | CommitChange

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
  issues: IssueRef[]
}

// --- Reader port -----------------------------------------------------------

// One commit as read from git: its SHA, author name (no email), and full
// message. SHA and author hydrate a direct (no-PR) change; the message yields
// the classification and, for direct changes, the description.
export type CommitRecord = {
  sha: string
  author: string
  message: string
}

// The IO surface both discovery paths consume. Production uses
// `makeGitHubGraphReader` (git + GitHub GraphQL); tests inject an in-memory
// reader built from plain data. The two PR fetchers are segregated so each
// phase fetches only the fields it renders: `fetchChangeDetails` pulls the full
// pull-request fields for the notes, `fetchClosingIssues` only the closing
// issue numbers finalize comments on.
export type ReleaseGraphReader = {
  readTags: () => string[]
  readCommits: (range: Range) => CommitRecord[]
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

// One record per commit in the range: SHA (%H), author name (%an), and full
// message (subject + body, %B), field-separated by \x1f and record-separated by
// \x1e (neither can occur in the fields). The body is needed so a `BREAKING
// CHANGE:` footer (below the subject) is detected; the SHA and author hydrate
// direct (no-PR) changes. We read the author (%an), not the committer (%cn): a
// web-UI edit records `GitHub` as the committer but the real person as the
// author, so the change is credited `, by <author>` rather than `, by GitHub`.
// Fields reach the parser only through git's stdout (no shell), so a crafted
// message cannot inject commands.
export function readCommits(range: Range): CommitRecord[] {
  const spec = range.from ? `${range.from}..${range.to}` : range.to
  return git(['log', spec, '--format=%H%x1f%an%x1f%B%x1e'])
    .split('\x1e')
    .map(record => record.trim())
    .filter(Boolean)
    .map(record => {
      const [sha = '', author = '', message = ''] = record.split('\x1f')
      return { sha, author, message }
    })
}

// One batched, aliased GraphQL query selecting `selection` on every PR by
// number, validated per node by `nodeSchema`. Squash-merge means PR numbers
// come straight from commit subjects, so no per-commit `associatedPullRequests`
// lookup is needed. `fnLabel` only tags the request URL for observability.
//
// A null node is dropped only when it is unaccompanied by a GraphQL error: that
// is the "PR resolved to nothing" case (transferred/deleted issue). GitHub
// returns HTTP 200 with a top-level `errors` array for partial failures (rate
// limit, timeout, internal error) while nulling the affected alias — so dropping
// every null blindly would silently lose a real PR from both the notes and the
// finalize comments. We therefore fail loud when any error is present, and warn
// on the (genuine) drops so they leave a trace.
export async function fetchPRNodes<T extends { number: number }>(args: {
  prNumbers: number[]
  githubToken: string
  fnLabel: string
  selection: string
  nodeSchema: z.ZodType<T>
}): Promise<T[]> {
  const { prNumbers, githubToken, fnLabel, selection, nodeSchema } = args
  if (prNumbers.length === 0) return []
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
      `${fnLabel}: GitHub API error ${response.status} ${response.statusText} for PRs [${prNumbers.join(', ')}]`
    )
  }
  const envelopeSchema = z.object({
    data: z.object({
      repository: z.record(z.string(), nodeSchema.nullable())
    }),
    errors: z.array(z.object({ message: z.string() })).optional()
  })
  const envelope = envelopeSchema.safeParse(await response.json())
  if (!envelope.success) {
    throw new Error(
      `${fnLabel}: unexpected GraphQL response shape for PRs [${prNumbers.join(', ')}]: ${envelope.error.message}`
    )
  }
  const { data, errors } = envelope.data
  if (errors && errors.length > 0) {
    // A null node here is a fetch failure, not a nonexistent PR — dropping it
    // would silently lose a real change. Fail the release instead.
    throw new Error(
      `${fnLabel}: GraphQL errors for PRs [${prNumbers.join(', ')}]: ${errors.map(e => e.message).join('; ')}`
    )
  }
  const resolved = Object.values(data.repository).filter(
    (node): node is T => node !== null
  )
  if (resolved.length < prNumbers.length) {
    const returned = new Set(resolved.map(node => node.number))
    const dropped = prNumbers.filter(number => !returned.has(number))
    console.warn(
      `${fnLabel}: ${dropped.length} PR(s) resolved to nothing (transferred/deleted), dropped: ${dropped.map(n => `#${n}`).join(', ')}`
    )
  }
  return resolved
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
  closingIssuesReferences: { edges: Array<{ node: IssueRef }> }
}

// Deduplicate closing issues across all PRs (a single issue can be closed by
// more than one PR across the range).
export function collectIssues(prs: WithClosingIssues[]): IssueRef[] {
  const numbers = new Set<number>()
  for (const pr of prs) {
    for (const { node } of pr.closingIssuesReferences.edges) {
      numbers.add(node.number)
    }
  }
  return [...numbers].map(number => ({ number }))
}

// Stage 1 of discovery: everything the git log alone yields for one commit in
// range, uniform across every commit. `type`/`breaking`/`description` come from
// the parsed message (`description` is the subject; `breaking` also honours a
// `BREAKING CHANGE:` body footer); `prNumber` is the squash `(#N)` suffix, or
// null for a direct commit. The notes path enriches a PR-linked entry with its
// fetched pull-request fields; a direct entry projects straight to a
// `CommitChange`. `sha` is the full hash, sliced to 8 only when rendered.
export type ParsedCommit = ParsedSubject & {
  readonly sha: string
  readonly author: string
  readonly prNumber: number | null
}

// Parse the range's commits into the uniform stage-1 form: one `ParsedCommit`
// per commit, in git order (newest-first). `extractPRNumber` reads the first
// line (the squash `(#N)` suffix); `parseCommit` reads the whole message, so a
// break flagged only by a `BREAKING CHANGE:` body footer is still detected. A
// PR number recurring across commits is deduplicated first-seen (authoritative
// under squash-merge, where one PR == one commit); a recurrence with a divergent
// `type`/`breaking` keeps the first entry but warns so the conflict is visible.
function parseCommits(records: CommitRecord[]): ParsedCommit[] {
  const parsed: ParsedCommit[] = []
  const seen = new Map<number, ParsedCommit>()
  for (const { sha, author, message } of records) {
    const firstLine = message.split('\n')[0] ?? ''
    const prNumber = extractPRNumber(firstLine)
    const { type, breaking, description } = parseCommit(message)
    if (prNumber === null) {
      parsed.push({ sha, author, prNumber, type, breaking, description })
      continue
    }
    const existing = seen.get(prNumber)
    if (existing === undefined) {
      const commit: ParsedCommit = {
        sha,
        author,
        prNumber,
        type,
        breaking,
        description
      }
      seen.set(prNumber, commit)
      parsed.push(commit)
    } else if (existing.type !== type || existing.breaking !== breaking) {
      // A `(#N)` recurring with a divergent classification (rare under
      // squash-merge). Keep the first-seen (authoritative) entry, but warn.
      console.warn(
        `commit-graph: PR #${prNumber} recurs with a conflicting classification; keeping the first-seen one.`
      )
    }
  }
  return parsed
}

// Project a fetched PR into a PR-sourced change: `type`/`breaking` from the
// squash commit (via `byNumber`), `description` from the PR title as prose (its
// type prefix stripped for display, never classified).
function toPRChange(pr: PR, byNumber: Map<number, ParsedCommit>): PRChange {
  const parsed = byNumber.get(pr.number)
  if (parsed === undefined) {
    // Fetched PRs are exactly the keys of `byNumber`, so a miss is an invariant
    // violation, not a data condition — fail loud rather than silently
    // classifying the change as untyped (which would drop its bump/category).
    throw new Error(
      `commit-graph: no squash-commit classification for PR #${pr.number}`
    )
  }
  return {
    source: 'squashedPR',
    prNumber: pr.number,
    type: parsed.type,
    breaking: parsed.breaking,
    description: parseSubject(pr.title).description,
    author: pr.author?.login ?? null,
    closingIssues: pr.closingIssuesReferences.edges.map(edge => ({
      number: edge.node.number
    }))
  }
}

// Project a direct (no-PR) parsed commit into a commit-sourced change: identity
// is the 8-char SHA, prose is the commit subject, author is the git author name.
function toCommitChange(commit: ParsedCommit): CommitChange {
  return {
    source: 'directCommit',
    sha: commit.sha.slice(0, 8),
    type: commit.type,
    breaking: commit.breaking,
    description: commit.description,
    author: commit.author
  }
}

// The shared range → parsed-commits core both phases build on. Resolve the
// channel-asymmetric range, read its commits (the classification authority), and
// parse them into the uniform stage-1 form. The PR-linked entries' numbers are
// the SSOT both phase-specific fetches key off.
export function parseRange(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): ParsedCommit[] {
  const { reader } = args
  const range = resolveRange({ ...args, tags: reader.readTags() })
  return parseCommits(reader.readCommits(range))
}

// Notes-path discovery: the shared core + `fetchChangeDetails`, projected into
// the full change list — the PR-sourced changes (classification from the commit,
// the rest hydrated from the PR) followed by the direct-commit changes — plus the
// release contributors (from the PRs only; commit authors are not GitHub
// handles). `fetchClosingIssues` is never touched.
export async function discoverChanges(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): Promise<ReleaseChanges> {
  const parsed = parseRange(args)
  const byNumber = new Map<number, ParsedCommit>()
  const directCommits: ParsedCommit[] = []
  for (const commit of parsed) {
    if (commit.prNumber === null) directCommits.push(commit)
    else byNumber.set(commit.prNumber, commit)
  }
  const prNumbers = [...byNumber.keys()]
  const prs =
    prNumbers.length > 0 ? await args.reader.fetchChangeDetails(prNumbers) : []
  const prChanges = prs.map(pr => toPRChange(pr, byNumber))
  // git log is newest-first; the notes list direct commits oldest-first.
  const commitChanges = directCommits.reverse().map(toCommitChange)
  return {
    changes: [...prChanges, ...commitChanges],
    contributors: collectContributors(prs)
  }
}

// Finalize-path discovery: the shared core + `fetchClosingIssues`, projected into
// comment targets — the release's PRs (by number) and their deduplicated closing
// issues. Direct-commit changes have no PR/issue to comment on, so they never
// appear here. `fetchChangeDetails` is never touched. The PRs come from the
// fetched (surviving) nodes, so a `(#N)` that resolves to nothing is dropped from
// the targets exactly as it is from the notes.
export async function discoverTargets(args: {
  channel: Channel
  currentRef: string
  reader: ReleaseGraphReader
}): Promise<ReleaseTargets> {
  const prNumbers = parseRange(args).flatMap(commit =>
    commit.prNumber !== null ? [commit.prNumber] : []
  )
  if (prNumbers.length === 0) {
    return { changes: [], issues: [] }
  }
  const prs = await args.reader.fetchClosingIssues(prNumbers)
  return {
    changes: prs.map(pr => ({ prNumber: pr.number })),
    issues: collectIssues(prs)
  }
}
