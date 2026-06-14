#!/usr/bin/env node

import type { ThrottlingOptions } from '@octokit/plugin-throttling'
import { createEnv } from '@t3-oss/env-core'
import { Octokit } from 'octokit'
import { z } from 'zod'
import type { Channel } from './compute-version.ts'
import {
  discoverTargets,
  makeGitHubGraphReader,
  resolveChannel
} from './lib/commit-graph.ts'
import { isValidSemver } from './lib/version.ts'

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

// A PR (from a commit subject) or an issue (from closingIssuesReferences).
export type Kind = 'PR' | 'issue'

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
  return `${emoji} This ${kind} is included in nuqs@${version}

The release is available on:
- 📦 [npm package (@${distTag})](https://npmx.dev/package/nuqs/v/${version})
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/${tag})

\`\`\`
pnpm add nuqs@${version}
\`\`\`

${releaseMarker(tag)}
`
}

// --- Pure core: idempotency -----------------------------------------------

// A comment as read from a thread: the author login (for the bot-author guard)
// and the raw body (scanned for the marker). The minimal projection the marker
// check needs — no ids, timestamps, or reactions.
export type ThreadComment = { author: string; body: string }

// Comments are posted by the release CI job under GITHUB_TOKEN, authoring as
// `github-actions[bot]`. The marker check requires this author: the sentinel is
// plain text visible in the page source, so a human — or an AI agent that echoes
// it back in a comment — could otherwise suppress a real release notification by
// posting the marker themselves.
export const RELEASE_BOT_LOGIN = 'github-actions[bot]'

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
    ({ author, body }) => author === RELEASE_BOT_LOGIN && body.includes(marker)
  )
}

// --- Use-case: the comment + label loop (tested at the IssueWriter port) ---

// A single issue/PR to comment on and label. `kind` comes for free from
// discovery (PRs from commit subjects, issues from closingIssuesReferences).
export type Target = { number: number; kind: Kind }

// One read of a target's idempotency state: its labels (does the channel label
// already exist?) and recent comments (did this bot already post the marker?).
// Both come from a single GraphQL query, so the two gates cost one round-trip.
export type Thread = { labels: string[]; comments: ThreadComment[] }

// The port the loop writes through. A narrow surface (read the thread, comment,
// add a label) that hides octokit, REST/GraphQL shapes, and throttling behind
// three verbs — so the loop's failure handling is exercised without any network.
export type IssueWriter = {
  getThread(issueNumber: number): Promise<Thread>
  comment(issueNumber: number, body: string): Promise<void>
  addLabel(issueNumber: number, label: string): Promise<void>
}

// Unrecoverable per-target failures are skipped with a warning rather than
// collected: a deleted/transferred target (the issue was removed — PRs cannot
// be) or a perms/abuse edge that survived the throttling retries. Collecting one
// would keep the run permanently red and block re-run convergence + the tail.
// Two error shapes reach here: the REST verbs (comment/addLabel) reject with a
// numeric HTTP `.status`; the GraphQL thread read rejects with a
// GraphqlResponseError — HTTP 200, no `.status`, carrying an `errors` array
// (`NOT_FOUND` for a gone target, `FORBIDDEN` for a scope problem). Both the 404
// and the NOT_FOUND (resp. 403/FORBIDDEN) mean the same thing, so map them alike.
function isUnrecoverable(error: unknown): boolean {
  const status = (error as { status?: number }).status
  if (status === 404 || status === 403) return true
  const graphqlErrors = (error as { errors?: Array<{ type?: string }> }).errors
  return (
    Array.isArray(graphqlErrors) &&
    graphqlErrors.some(
      ({ type }) => type === 'NOT_FOUND' || type === 'FORBIDDEN'
    )
  )
}

// Comment on and label every impacted issue/PR, sequentially (to stay clear of
// secondary rate limits). One thread read drives two independent idempotency
// gates: the marker decides the comment (its body *is* the record), the label's
// own presence decides the label. Both converge on re-run — a half-finished
// target completes only its missing side, with no duplicate comment and no
// useless label mutation. Never aborts mid-loop — unrecoverable failures are
// skipped, all others collected and re-thrown so the job goes red and a re-run
// completes the rest.
export async function commentAndLabel(args: {
  writer: IssueWriter
  tag: string
  info: ChannelInfo
  targets: Target[]
}): Promise<void> {
  const { writer, tag, info, targets } = args
  const marker = releaseMarker(tag)
  const errors: unknown[] = []
  let unrecoverable = 0
  for (const { number, kind } of targets) {
    try {
      const { labels, comments } = await writer.getThread(number)
      const needsComment = !hasReleaseComment(comments, marker)
      const needsLabel = !labels.includes(info.label)
      if (!needsComment && !needsLabel) {
        console.log(`#${number}: already finalized, skipping`)
        continue
      }
      const did: string[] = []
      if (needsComment) {
        await writer.comment(number, renderComment({ tag, kind }))
        did.push('commented')
      }
      if (needsLabel) {
        await writer.addLabel(number, info.label)
        did.push(`labelled "${info.label}"`)
      }
      console.log(`#${number}: ${did.join(' + ')}`)
    } catch (error) {
      if (isUnrecoverable(error)) {
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
      `${errors.length} issue(s)/PR(s) failed to finalize; re-run to complete the stragglers.`
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

// Changes (by PR number) ∪ their closing issues, the full comment set. Numbers
// are unique across issues and PRs in one repo, so the two lists never collide.
function collectTargets(
  changes: Array<{ prNumber: number }>,
  issues: Array<{ number: number }>
): Target[] {
  return [
    ...changes.map(
      ({ prNumber }): Target => ({ number: prNumber, kind: 'PR' })
    ),
    ...issues.map(({ number }): Target => ({ number, kind: 'issue' }))
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

// The octokit-backed IssueWriter adapter. An octokit pre-wired with the
// throttling plugin (secondary-rate-limit responses retried with backoff
// rather than dropping a comment; primary limits retried a few times, secondary
// always — they are transient), wrapped in the three port verbs.
// The thread read goes through GraphQL (see `getThread`);
function makeOctokitWriter(args: {
  auth: string
  owner: string
  repo: string
}): IssueWriter {
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
  return {
    async getThread(issue_number) {
      // GraphQL, not REST: the REST issue-comments endpoint is oldest-first with
      // no direction param, so the freshly-posted marker sits on the last page;
      // `comments(last: N)` fetches the recent tail where it lives, and the same
      // query returns the labels — both gates in one round-trip. Goes through the
      // throttling plugin like every other request.
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
        { owner, repo, number: issue_number, window: COMMENT_SCAN_WINDOW }
      )
      const parsed = threadSchema.safeParse(data)
      if (!parsed.success) {
        throw new Error(
          `getThread(#${issue_number}): unexpected GraphQL response: ${parsed.error.message}`
        )
      }
      const node = parsed.data.repository.issueOrPullRequest
      return {
        labels: node?.labels.nodes.map(label => label.name) ?? [],
        comments: (node?.comments.nodes ?? []).map(comment => ({
          author: comment.author?.login ?? '',
          body: comment.body
        }))
      }
    },
    async comment(issue_number, body) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body
      })
    },
    async addLabel(issue_number, label) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number,
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
  const { changes, issues } = await discoverTargets({
    channel: info.channel,
    currentRef: env.TAG,
    reader: makeGitHubGraphReader(env.GITHUB_TOKEN)
  })
  const targets = collectTargets(changes, issues)
  console.log(
    `Finalizing ${env.TAG} (${info.channel}) → ${targets.length} issue(s)/PR(s)`
  )
  await commentAndLabel({
    writer: makeOctokitWriter({ auth: env.GITHUB_TOKEN, owner, repo }),
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
