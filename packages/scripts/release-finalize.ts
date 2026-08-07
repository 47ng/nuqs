#!/usr/bin/env node

import type { ThrottlingOptions } from '@octokit/plugin-throttling'
import { createEnv } from '@t3-oss/env-core'
import { Octokit, RequestError } from 'octokit'
import { z } from 'zod'
import type { Channel } from './compute-version.ts'
import {
  type Discussion,
  discoverTargets,
  makeGitHubGraphReader,
  resolveChannel
} from './lib/commit-graph.ts'
import { isGA, isValidSemver } from './lib/version.ts'

// --- Pure core: channel presentation --------------------------------------

// Everything that differs between channels: the comment emoji, the npm
// dist-tag the release lands on, and the existing semantic-release label,
// reused verbatim as a queryable channel tag — applied idempotently but no
// longer the idempotency record (the comment's embedded marker is).
type ChannelInfo = {
  channel: Channel
  emoji: string
  distTag: 'latest' | 'beta'
  label: string
}

export function resolveChannelInfo(tag: string): ChannelInfo {
  return resolveChannel(tag) === 'stable'
    ? { channel: 'stable', emoji: '🚀', distTag: 'latest', label: 'released' }
    : {
        channel: 'beta',
        emoji: '🧪',
        distTag: 'beta',
        label: 'released on @beta'
      }
}

// --- Pure core: comment rendering -----------------------------------------

// A PR (from a commit subject), an issue (from closingIssuesReferences), or a
// discussion (from a PR body's target reference). Discussions never appear in
// closingIssuesReferences — a PR can't auto-close one — so discovery parses them
// out of the body separately (see `discussionCandidates`).
export type Kind = 'PR' | 'issue' | 'discussion'

// The HTML-comment idempotency marker embedded in every finalize comment.
// Invisible in rendered markdown, matched verbatim on re-run, and keyed by
// release version (tag minus the leading `v`) — so a GA finalize is not
// suppressed by a PR's earlier beta marker, mirroring the old per-channel label.
export function releaseMarker(tag: string): string {
  return `<!-- release-finalize:nuqs@${tag.replace(/^v/, '')} -->`
}

// The released-in comment, a single editable template literal. Channel drives
// the emoji and dist-tag; the version (tag without the leading `v`) drives the
// npmx package link and install snippet; the tag drives the release-notes link.
export function renderComment(args: { tag: string; kind: Kind }): string {
  const { tag, kind } = args
  const { emoji, distTag } = resolveChannelInfo(tag)
  const version = tag.replace(/^v/, '')
  const outcome =
    kind === 'PR'
      ? 'PR is included'
      : kind === 'issue'
        ? 'issue is resolved'
        : 'discussion is addressed'
  const tryBeta = isGA(tag)
    ? ''
    : `> Please try out beta & pre-releases, it's the best moment for your feedback to be heard. -- [TkDodo](https://youtu.be/l3PxErcKeAI?t=1725)\n\n`
  return `${emoji} This ${outcome} in nuqs@${version}

The release is available on:
- 📦 [npm package (@${distTag})](https://npmx.dev/package/nuqs/v/${version})
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/${tag})

\`\`\`
pnpm add nuqs@${version}
\`\`\`

${tryBeta}${releaseMarker(tag)}
`
}

// --- Pure core: idempotency -----------------------------------------------

// A comment as read from a thread: the author login (for the bot-author guard)
// and the raw body (scanned for the marker). The minimal projection the marker
// check needs — no ids, timestamps, or reactions.
export type ThreadComment = { author: string; body: string }

// The release CI job posts comments under GITHUB_TOKEN, whose actor is the GitHub
// Actions app. That one actor's login is spelled two ways depending on the API:
// GraphQL returns the bare `github-actions`, REST returns `github-actions[bot]`.
// Finalize reads threads over GraphQL, so the bare form is what actually reaches
// this guard at runtime — but `isReleaseBot` tolerates both, mirroring `isBot` in
// commit-graph.ts, which already encodes this same dual-convention quirk (and was
// the reason this guard's earlier `=== 'github-actions[bot]'` silently never
// matched, re-commenting on every re-run).
//
// The marker check requires this author: the sentinel is plain text visible in the
// page source, so a human — or an AI agent that echoes it back in a comment — could
// otherwise suppress a real release notification by posting the marker themselves.
// The `github-actions` login namespace is GitHub-controlled (a user cannot claim
// it), so matching the login is a sufficient anti-spoof guard.
const RELEASE_BOT_LOGIN = 'github-actions'

export function isReleaseBot(login: string): boolean {
  return login.replace(/\[bot\]$/, '').toLowerCase() === RELEASE_BOT_LOGIN
}

// Comment gate: this bot has already posted this release's marker comment.
// The marker lives in the comment body, so posting the comment and persisting the
// record are one write — a target is never double-notified (a re-run finds the
// marker and skips) nor silently missed (a failed comment leaves no marker, so a
// re-run re-posts). Per-version scoping keeps a GA finalize commenting a PR that
// earlier carried only a beta marker; it relies on `discoverTargets`' invariant
// that each target appears in at most one beta finalize (the incremental beta
// range), so a per-version marker never double-comments where the old
// per-channel label would have suppressed.
export function hasReleaseComment(
  comments: ThreadComment[],
  marker: string
): boolean {
  return comments.some(
    ({ author, body }) => isReleaseBot(author) && body.includes(marker)
  )
}

// --- Use-case: the comment + label loop (tested at the TargetWriter port) ---

// A single target to comment on and label. `kind` comes for free from discovery
// (PRs from commit subjects, issues from closingIssuesReferences, discussions
// from PR-body target references). A discussion also carries its GraphQL node id:
// the Discussion mutations (comment, label) are keyed by node id, not number, and
// the issue/PR REST verbs never need one — so the id rides only on the variant
// that uses it.
export type Target =
  | { kind: 'PR' | 'issue'; number: number }
  | { kind: 'discussion'; number: number; id: string }

// One read of a target's idempotency state: its labels (does the channel label
// already exist?) and recent comments (did this bot already post the marker?).
// Both come from a single GraphQL query, so the two gates cost one round-trip.
export type Thread = { labels: string[]; comments: ThreadComment[] }

// The port the loop writes through. A narrow surface (read the thread, comment,
// add a label) that hides octokit, REST/GraphQL shapes, and throttling behind
// three verbs — so the loop's failure handling is exercised without any network.
// Each verb takes the whole `Target`, not a bare number: the adapter dispatches
// transport by `kind` (issue/PR over REST, discussion over GraphQL) and reads the
// discussion node id off the target — the loop itself stays kind-agnostic.
export type TargetWriter = {
  getThread(target: Target): Promise<Thread>
  comment(target: Target, body: string): Promise<void>
  addLabel(target: Target, label: string): Promise<void>
}

// A GraphQL field error: a thrown Error carrying GraphQL's `errors` array (the
// GraphqlResponseError shape). octokit re-exports RequestError but not
// GraphqlResponseError, so we recognise it by shape with a type guard rather than
// an `as` cast. Only each entry's `type` discriminant matters to us.
type GraphqlFieldError = Error & {
  errors: ReadonlyArray<{ type?: string }>
}

function isGraphqlFieldError(error: unknown): error is GraphqlFieldError {
  return (
    error instanceof Error && 'errors' in error && Array.isArray(error.errors)
  )
}

// Unrecoverable per-target failures are skipped with a warning rather than
// collected: a deleted/transferred target (an issue can be removed; a PR cannot)
// or a genuine perms/abuse refusal. Collecting one would keep the run permanently
// red and block both re-run convergence and the tail.
//
// Two error shapes reach here, one per transport:
//   - the REST verbs (comment/addLabel) reject with a RequestError carrying a
//     numeric HTTP `.status`;
//   - the GraphQL thread read rejects with a GraphqlResponseError: HTTP 200, no
//     `.status`, carrying an `errors` array (`NOT_FOUND` for a gone target,
//     `FORBIDDEN` for a scope problem), matched by `isGraphqlFieldError`.
//
// On 403 specifically (reviewers keep reading this as a dropped rate limit, so to
// be explicit): a 403 here is NEVER a transient rate limit. The throttling plugin
// absorbs rate limits before they reach this catch — secondary limits retry
// indefinitely, primary limits retry with backoff until the quota resets (see the
// `throttle` config in `makeOctokitTargetWriter`). A rate-limited request is retried,
// not rejected, so it never lands here. A 403 that does survive to here is a real
// permissions/abuse refusal, equivalent to 404 for our purposes (this one target
// cannot be written), so we skip it. A misconfiguration that 403s *every* target
// is caught downstream by `commentAndLabel`'s all-unrecoverable guard.
//
// Anything else (a network error, a non-RequestError throw) is treated as
// recoverable: collected, so the job fails loud and a re-run retries the target.
function isUnrecoverable(error: unknown): boolean {
  if (error instanceof RequestError) {
    return error.status === 404 || error.status === 403
  }
  if (isGraphqlFieldError(error)) {
    return error.errors.some(
      ({ type }) => type === 'NOT_FOUND' || type === 'FORBIDDEN'
    )
  }
  return false
}

// Comment on and label every impacted issue/PR/discussion, sequentially (to stay
// clear of secondary rate limits). One thread read drives two independent
// idempotency gates: the marker decides the comment (its body *is* the record),
// the label's own presence decides the label. Both converge on re-run — a
// half-finished target completes only its missing side, with no duplicate comment
// and no useless label mutation. Never aborts mid-loop — unrecoverable failures
// are skipped, all others collected and re-thrown so the job goes red and a
// re-run completes the rest.
export async function commentAndLabel(args: {
  writer: TargetWriter
  tag: string
  info: ChannelInfo
  targets: Target[]
}): Promise<void> {
  const { writer, tag, info, targets } = args
  const marker = releaseMarker(tag)
  const errors: unknown[] = []
  let unrecoverable = 0
  for (const target of targets) {
    const { number, kind } = target
    // Hoisted out of the try: a non-empty `did` means we already wrote to this
    // target this run, which proves it is reachable and writable — so a later
    // failure (e.g. the label after a successful comment) is a real fault, not a
    // deleted/forbidden target. Collect it (→ red run, re-run completes the
    // missing side) rather than swallowing it as unrecoverable, which would
    // leave the target silently commented-but-unlabelled on a green run.
    const did: string[] = []
    try {
      const { labels, comments } = await writer.getThread(target)
      const needsComment = !hasReleaseComment(comments, marker)
      const needsLabel = !labels.includes(info.label)
      if (!needsComment && !needsLabel) {
        console.log(`#${number}: already finalized, skipping`)
        continue
      }
      if (needsComment) {
        await writer.comment(target, renderComment({ tag, kind }))
        did.push('commented')
      }
      if (needsLabel) {
        await writer.addLabel(target, info.label)
        did.push(`labelled "${info.label}"`)
      }
      console.log(`#${number}: ${did.join(' + ')}`)
    } catch (error) {
      if (did.length === 0 && isUnrecoverable(error)) {
        unrecoverable++
        console.warn(`#${number}: skipped (unrecoverable):`, error)
        continue
      }
      console.error(`#${number}: failed (will retry on re-run):`, error)
      errors.push(error)
    }
  }
  if (errors.length > 0) {
    throw new Error(
      `${errors.length} target(s) failed to finalize; re-run to complete the stragglers.`
    )
  }
  // A whole release's worth of targets (more than one) all unrecoverable is a
  // misconfiguration signature — a wrong token scope or GITHUB_REPOSITORY — not N
  // genuine deletions. Fail loud rather than report an all-green no-op. (A lone
  // skipped target stays green: an isolated deleted issue is plausible.)
  if (targets.length > 1 && unrecoverable === targets.length) {
    throw new Error(
      `All ${targets.length} targets failed unrecoverably (403/404 or GraphQL FORBIDDEN/NOT_FOUND) — likely a token/repository misconfiguration, not genuine deletions.`
    )
  }
}

// --- IO shell (untested by design: thin glue over the tested core) --------

// Changes (by PR number) ∪ their closing issues ∪ the resolved discussions — the
// full target set. Issues, PRs, and discussions share one number sequence per
// repo, so the three lists never collide.
function collectTargets(
  changes: Array<{ prNumber: number }>,
  issues: number[],
  discussions: Discussion[]
): Target[] {
  return [
    ...changes.map(
      ({ prNumber }): Target => ({ kind: 'PR', number: prNumber })
    ),
    ...issues.map((number): Target => ({ kind: 'issue', number })),
    ...discussions.map(
      ({ number, id }): Target => ({ kind: 'discussion', number, id })
    )
  ]
}

// How many of a thread's most-recent comments to scan for the marker.
const COMMENT_SCAN_WINDOW = 20

// `issueOrPullRequest` resolves either kind by number, so one query serves PRs
// and issues. octokit.graphql returns the unwrapped `data`;
// author is nullable (ghost/deleted accounts), labels and body are not.
const threadSchema = z.object({
  repository: z.object({
    issueOrPullRequest: z
      .object({
        labels: z.object({ nodes: z.array(z.object({ name: z.string() })) }),
        comments: z.object({
          nodes: z.array(
            z.object({
              author: z.object({ login: z.string() }).nullable(),
              body: z.string()
            })
          )
        })
      })
      .nullable()
  })
})

// The discussion thread read goes through `node(id:)` (discovery already holds
// the node id), narrowed to Discussion. Same labels+comments shape as the issue/PR
// read — both feed the one `Thread` the gates consume — except a Discussion's
// `labels` connection is itself nullable.
const discussionThreadSchema = z.object({
  node: z
    .object({
      labels: z
        .object({ nodes: z.array(z.object({ name: z.string() })) })
        .nullable(),
      comments: z.object({
        nodes: z.array(
          z.object({
            author: z.object({ login: z.string() }).nullable(),
            body: z.string()
          })
        )
      })
    })
    .nullable()
})

// `repository.label(name:)` resolves a label's node id, which the
// `addLabelsToLabelable` discussion mutation needs (it is keyed by id, unlike the
// REST issue endpoint, which takes the name). Null when the label doesn't exist.
const labelSchema = z.object({
  repository: z.object({
    label: z.object({ id: z.string() }).nullable()
  })
})

// The labels+comments node shape shared by the issue/PR and discussion reads,
// projected to the `Thread` the idempotency gates consume. A null node (gone
// target) or null labels connection yields an empty thread, so the gates see
// "nothing posted, nothing labelled" and the loop re-posts (a re-comment then
// fails unrecoverably on the gone target, and is skipped).
type ThreadNode = {
  labels: { nodes: Array<{ name: string }> } | null
  comments: {
    nodes: Array<{ author: { login: string } | null; body: string }>
  }
} | null

function projectThread(node: ThreadNode): Thread {
  return {
    labels: node?.labels?.nodes.map(label => label.name) ?? [],
    comments: (node?.comments.nodes ?? []).map(comment => ({
      author: comment.author?.login ?? '',
      body: comment.body
    }))
  }
}

// The octokit-backed TargetWriter adapter. An octokit pre-wired with the
// throttling plugin (secondary-rate-limit responses retried with backoff
// rather than dropping a comment; primary limits retried a few times, secondary
// always — they are transient), wrapped in the three port verbs. Each verb
// dispatches by `kind`: issues/PRs go over the REST issues endpoints (which serve
// PRs too), discussions over the Discussion GraphQL mutations (no REST
// equivalent). The thread reads both go through GraphQL; `getThread` explains why.
function makeOctokitTargetWriter(args: {
  auth: string
  owner: string
  repo: string
}): TargetWriter {
  const throttle: ThrottlingOptions = {
    onRateLimit(_retryAfter, options, octokit, retryCount) {
      octokit.log.warn(`Rate limit for ${options.method} ${options.url}`)
      return retryCount < 3
    },
    onSecondaryRateLimit(_retryAfter, options, octokit) {
      octokit.log.warn(
        `Secondary rate limit for ${options.method} ${options.url}`
      )
      return true
    }
  }
  const octokit = new Octokit({ auth: args.auth, throttle })
  const { owner, repo } = args

  // Issue/PR thread read. GraphQL, not REST: the REST issue-comments endpoint is
  // oldest-first with no direction param, so the freshly-posted marker sits on
  // the last page; `comments(last: N)` fetches the recent tail where it lives,
  // and the same query returns the labels — both gates in one round-trip. Goes
  // through the throttling plugin like every other request.
  async function getIssueThread(number: number): Promise<Thread> {
    const data = await octokit.graphql(
      `query ($owner: String!, $repo: String!, $number: Int!, $window: Int!) {
        repository(owner: $owner, name: $repo) {
          issueOrPullRequest(number: $number) {
            ... on Issue {
              labels(first: 10) { nodes { name } }
              comments(last: $window) { nodes { author { login } body } }
            }
            ... on PullRequest {
              labels(first: 10) { nodes { name } }
              comments(last: $window) { nodes { author { login } body } }
            }
          }
        }
      }`,
      { owner, repo, number, window: COMMENT_SCAN_WINDOW }
    )
    const parsed = threadSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(
        `getThread(#${number}): unexpected GraphQL response: ${parsed.error.message}`
      )
    }
    return projectThread(parsed.data.repository.issueOrPullRequest)
  }

  // Discussion thread read, via `node(id:)` narrowed to Discussion (discussions
  // aren't reachable through `issueOrPullRequest`). Same recent-tail + labels
  // round-trip as the issue/PR read.
  async function getDiscussionThread(
    id: string,
    number: number
  ): Promise<Thread> {
    const data = await octokit.graphql(
      `query ($id: ID!, $window: Int!) {
        node(id: $id) {
          ... on Discussion {
            labels(first: 10) { nodes { name } }
            comments(last: $window) { nodes { author { login } body } }
          }
        }
      }`,
      { id, window: COMMENT_SCAN_WINDOW }
    )
    const parsed = discussionThreadSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(
        `getThread(#${number}): unexpected GraphQL response: ${parsed.error.message}`
      )
    }
    return projectThread(parsed.data.node)
  }

  // The label node id `addLabelsToLabelable` needs, resolved once per name and
  // memoised: a release applies a single label across every discussion, so this
  // is one extra round-trip total, not one per discussion.
  const labelIds = new Map<string, Promise<string>>()
  function resolveLabelId(name: string): Promise<string> {
    const cached = labelIds.get(name)
    if (cached) return cached
    const pending = (async () => {
      const data = await octokit.graphql(
        `query ($owner: String!, $repo: String!, $name: String!) {
          repository(owner: $owner, name: $repo) { label(name: $name) { id } }
        }`,
        { owner, repo, name }
      )
      const parsed = labelSchema.safeParse(data)
      if (!parsed.success || parsed.data.repository.label === null) {
        throw new Error(
          `addLabel: label "${name}" not found in ${owner}/${repo}`
        )
      }
      return parsed.data.repository.label.id
    })()
    labelIds.set(name, pending)
    return pending
  }

  return {
    getThread(target) {
      return target.kind === 'discussion'
        ? getDiscussionThread(target.id, target.number)
        : getIssueThread(target.number)
    },
    async comment(target, body) {
      if (target.kind === 'discussion') {
        // No REST equivalent — discussion comments are a GraphQL mutation.
        // Locking a discussion does not block this: a locked conversation still
        // accepts comments from write-access actors, and finalize holds
        // `discussions: write` — so a locked discussion is commented on just like
        // a locked issue (verified against a real locked discussion). We never
        // lock or close anything ourselves, mirroring how issues are handled.
        await octokit.graphql(
          `mutation ($discussionId: ID!, $body: String!) {
            addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
              comment { id }
            }
          }`,
          { discussionId: target.id, body }
        )
        return
      }
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: target.number,
        body
      })
    },
    async addLabel(target, label) {
      if (target.kind === 'discussion') {
        await octokit.graphql(
          `mutation ($labelableId: ID!, $labelIds: [ID!]!) {
            addLabelsToLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
              clientMutationId
            }
          }`,
          { labelableId: target.id, labelIds: [await resolveLabelId(label)] }
        )
        return
      }
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: target.number,
        labels: [label]
      })
    }
  }
}

async function main(): Promise<void> {
  const env = createEnv({
    server: {
      GITHUB_TOKEN: z.string().min(1),
      // `release.tag_name` from the publish event; the only release input read.
      TAG: z.string().refine(isValidSemver, {
        error: 'TAG is not a valid semver string'
      }),
      // "owner/repo", set by Actions (defaulted for local runs).
      GITHUB_REPOSITORY: z.string().default('47ng/nuqs')
    },
    isServer: true,
    runtimeEnv: process.env
  })
  const [owner, repo] = env.GITHUB_REPOSITORY.split('/') as [string, string]
  const info = resolveChannelInfo(env.TAG)
  // Finalize phase: the just-published tag exists on the drafted HEAD, so the
  // lean path resolves the identical set the draft notes listed.
  const { changes, issues, discussions } = await discoverTargets({
    channel: info.channel,
    currentRef: env.TAG,
    reader: makeGitHubGraphReader(env.GITHUB_TOKEN)
  })
  const targets = collectTargets(changes, issues, discussions)
  console.log(
    `Finalizing ${env.TAG} (${info.channel}) → ${targets.length} target(s)`
  )
  await commentAndLabel({
    writer: makeOctokitTargetWriter({ auth: env.GITHUB_TOKEN, owner, repo }),
    tag: env.TAG,
    info,
    targets
  })
}

if (import.meta.main) {
  main().catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}
