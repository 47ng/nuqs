#!/usr/bin/env node

import type { ThrottlingOptions } from '@octokit/plugin-throttling'
import { createEnv } from '@t3-oss/env-core'
import { Octokit } from 'octokit'
import { z } from 'zod'
import type { Channel } from './compute-version.ts'
import {
  discoverRelease,
  makeGitHubGraphReader,
  resolveChannel
} from './lib/commit-graph.ts'
import { isValidSemver } from './lib/version.ts'

// --- Pure core: channel presentation --------------------------------------

// Everything that differs between channels: the comment emoji, the npm
// dist-tag the release lands on, and the existing semantic-release label
// reused verbatim as the idempotency marker.
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
`
}

// --- Pure core: idempotency -----------------------------------------------

// The channel label itself is the idempotency marker: skip any issue/PR that
// already carries this release's channel label. Sound because the asymmetric
// range visits each issue at most once per channel, and a GA re-commenting a
// beta'd PR uses a different label (so it is not suppressed). Re-running a
// partially-failed finalize thus converges without double-commenting.
export function shouldSkip(
  issueLabels: string[],
  channelLabel: string
): boolean {
  return issueLabels.includes(channelLabel)
}

// --- Use-case: the comment + label loop (tested at the IssueWriter port) ---

// A single issue/PR to comment on and label. `kind` comes for free from
// discovery (PRs from commit subjects, issues from closingIssuesReferences).
export type Target = { number: number; kind: Kind }

// The port the loop writes through. A narrow surface (read labels, comment,
// add a label) that hides octokit, REST shapes, and throttling behind three
// verbs — so the loop's failure handling is exercised without any network.
export type IssueWriter = {
  getLabels(issueNumber: number): Promise<string[]>
  comment(issueNumber: number, body: string): Promise<void>
  addLabel(issueNumber: number, label: string): Promise<void>
}

// Unrecoverable per-target failures are skipped with a warning rather than
// collected: a 404 (the issue was deleted — PRs cannot be) or a 403 that
// survived the throttling retries (a genuine perms/abuse edge). Collecting one
// would keep the run permanently red and block re-run convergence + the tail.
function isUnrecoverable(error: unknown): boolean {
  const status = (error as { status?: number }).status
  return status === 404 || status === 403
}

// Comment on and label every impacted issue/PR, sequentially (to stay clear of
// secondary rate limits). Per target: skip if it already carries this release's
// channel label (idempotency); otherwise comment then label. Never aborts
// mid-loop — unrecoverable failures are skipped, all others collected and
// re-thrown at the end so the job goes red and a re-run completes the rest.
export async function commentAndLabel(args: {
  writer: IssueWriter
  tag: string
  info: ChannelInfo
  targets: Target[]
}): Promise<void> {
  const { writer, tag, info, targets } = args
  const errors: unknown[] = []
  for (const { number, kind } of targets) {
    try {
      if (shouldSkip(await writer.getLabels(number), info.label)) {
        console.log(`#${number}: already labelled "${info.label}", skipping`)
        continue
      }
      // Comment before labelling, mirroring @semantic-release/github: the label
      // is the idempotency marker, so it lands last (a labelled target is done).
      await writer.comment(number, renderComment({ tag, kind }))
      await writer.addLabel(number, info.label)
      console.log(`#${number}: commented + labelled "${info.label}"`)
    } catch (error) {
      if (isUnrecoverable(error)) {
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

// The octokit-backed IssueWriter adapter. An octokit pre-wired with the
// throttling plugin (secondary-rate-limit responses retried with backoff
// rather than dropping a comment; primary limits retried a few times, secondary
// always — they are transient), wrapped in the three port verbs. addLabels does
// not auto-create labels — moot, the channel labels pre-exist.
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
    async getLabels(issue_number) {
      const { data } = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number
      })
      return data.labels.map(label =>
        typeof label === 'string' ? label : (label.name ?? '')
      )
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
  // shared engine resolves the identical set the draft notes listed.
  const { changes, issues } = await discoverRelease({
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
