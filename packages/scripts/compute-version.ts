#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import {
  type Bump,
  bumpForType,
  parseCommit
} from './lib/conventional-commits.ts'
import { git, readAllTags } from './lib/git.ts'
import { bumpGA, greatestGATag, highestBetaNumber } from './lib/version.ts'

export type Channel = 'stable' | 'beta'
export type ReleasePlan = {
  version: string
  tag: string
  distTag: 'latest' | 'beta'
  bump: Bump
}

const RANKS: Record<Bump, number> = { major: 3, minor: 2, patch: 1 }

// The highest GA tag (e.g. "v2.10.0"), ignoring -beta.* tags, or null when
// there are none — the previous stable checkpoint.
export const selectLastGATag = greatestGATag

function highestBump(commits: string[]): Bump | null {
  let highest: Bump | null = null
  for (const commit of commits) {
    const { type, breaking } = parseCommit(commit)
    const bump = bumpForType(type, breaking)
    if (bump && (highest === null || RANKS[bump] > RANKS[highest])) {
      highest = bump
    }
  }
  return highest
}

export function computeVersion(args: {
  channel: Channel
  lastGATag: string | null
  commits: string[]
  tags: string[]
}): ReleasePlan | null {
  const bump = highestBump(args.commits)
  if (!bump) return null
  const lastGA = args.lastGATag?.replace(/^v/, '') ?? '0.0.0'
  const targetGA = bumpGA(lastGA, bump)

  if (args.channel === 'stable') {
    return { version: targetGA, tag: `v${targetGA}`, distTag: 'latest', bump }
  }

  const next = highestBetaNumber(args.tags, targetGA) + 1
  const version = `${targetGA}-beta.${next}`
  return { version, tag: `v${version}`, distTag: 'beta', bump }
}

// --- IO layer (untested by design: the pure core above is the unit) -------

// Commit messages reach the parser only through git's stdout — never a shell —
// so a crafted message cannot inject commands. Each record is a full message
// (subject + body, %B) split on \x1e, which cannot occur in a message: the body
// is needed so a `BREAKING CHANGE:` footer triggers a major bump per the spec.
function readCommitsSince(lastGATag: string | null): string[] {
  const range = lastGATag ? `${lastGATag}..HEAD` : 'HEAD'
  return git(['log', range, '--format=%B%x1e'])
    .split('\x1e')
    .map(record => record.trim())
    .filter(Boolean)
}

function main(): void {
  const env = createEnv({
    server: { CHANNEL: z.enum(['stable', 'beta']) },
    isServer: true,
    runtimeEnv: process.env
  })

  const tags = readAllTags()
  const lastGATag = selectLastGATag(tags)
  const commits = readCommitsSince(lastGATag)
  const plan = computeVersion({
    channel: env.CHANNEL,
    lastGATag,
    commits,
    tags
  })

  if (plan === null) {
    // Not a failure: signal "no release" so the workflow stops cleanly
    // (the ci/stage jobs gate on release=true) instead of going red.
    console.error(
      `No version-bumping commits since ${lastGATag ?? 'the beginning'}. Nothing to release.`
    )
    process.stdout.write('needsReleasing=false\n')
    return
  }

  // Human-readable trace on stderr; the caller routes stdout where it wants
  // (the workflow appends it to $GITHUB_OUTPUT).
  console.error(
    [
      `Channel:  ${env.CHANNEL}`,
      `Last GA:  ${lastGATag ?? '(none)'}`,
      `Bump:     ${plan.bump}`,
      `Version:  ${plan.version}`,
      `Tag:     ${plan.tag}`,
      `Dist-tag: ${plan.distTag}`
    ].join('\n')
  )

  // Machine-readable `key=value` lines on stdout (only what the workflow
  // consumes; `bump` stays an internal detail shown in the trace above).
  process.stdout.write(
    `needsReleasing=true\nversion=${plan.version}\ntag=${plan.tag}\ndist-tag=${plan.distTag}\n`
  )
}

if (import.meta.main) {
  main()
}
