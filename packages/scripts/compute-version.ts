#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import {
  type Bump,
  bumpForType,
  parseCommit
} from './lib/conventional-commits.ts'
import {
  readReleaseHistory,
  tagExists,
  type ReleaseHistoryEntry
} from './lib/git.ts'
import {
  bumpGA,
  type Channel,
  greatestGATag,
  highestBetaNumber,
  resolveRange
} from './lib/version.ts'

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

// Beta releases announce only changes since the latest published version,
// while stable releases remain cumulative from the latest GA.
export function selectLastReleaseTag(
  channel: Channel,
  tags: string[]
): string | null {
  return resolveRange({ channel, currentRef: 'HEAD', tags }).from
}

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
  history: ReleaseHistoryEntry[]
}): ReleasePlan | null {
  const tags = args.history.flatMap(commit => commit.tags)
  const lastGATag = selectLastGATag(tags)
  const lastReleaseTag = selectLastReleaseTag(args.channel, tags)
  const commitsSince = (tag: string | null): string[] => {
    if (tag === null) {
      return args.history.map(commit => commit.message)
    }

    const taggedCommit = args.history.find(commit => commit.tags.includes(tag))
    if (!taggedCommit)
      throw new Error(`Release tag ${tag} is missing from history`)

    const commitsByHash = new Map(
      args.history.map(commit => [commit.hash, commit])
    )
    const releasedCommits = new Set<string>()
    const pending = [taggedCommit.hash]
    while (pending.length > 0) {
      const hash = pending.pop()
      if (!hash || releasedCommits.has(hash)) continue
      releasedCommits.add(hash)
      pending.push(...(commitsByHash.get(hash)?.parents ?? []))
    }

    return args.history
      .filter(commit => !releasedCommits.has(commit.hash))
      .map(commit => commit.message)
  }

  const bump = highestBump(commitsSince(lastGATag))
  if (!bump || !highestBump(commitsSince(lastReleaseTag))) return null
  const lastGA = lastGATag?.replace(/^v/, '') ?? '0.0.0'
  const targetGA = bumpGA(lastGA, bump)

  if (args.channel === 'stable') {
    return { version: targetGA, tag: `v${targetGA}`, distTag: 'latest', bump }
  }

  const next = highestBetaNumber(tags, targetGA) + 1
  const version = `${targetGA}-beta.${next}`
  return { version, tag: `v${version}`, distTag: 'beta', bump }
}

function main(): void {
  const env = createEnv({
    server: { CHANNEL: z.enum(['stable', 'beta']) },
    isServer: true,
    runtimeEnv: process.env
  })

  const history = readReleaseHistory()
  const tags = history.flatMap(commit => commit.tags)
  const lastGATag = selectLastGATag(tags)
  const lastReleaseTag = selectLastReleaseTag(env.CHANNEL, tags)
  const plan = computeVersion({
    channel: env.CHANNEL,
    history
  })

  if (plan === null) {
    // Not a failure: signal "no release" so the workflow stops cleanly
    // (the jobs gate on needsReleasing=true) instead of going red.
    console.error(
      `No version-bumping commits since ${lastReleaseTag ?? 'the beginning'}. Nothing to release.`
    )
    process.stdout.write('needsReleasing=false\n')
    return
  }

  if (tagExists(plan.tag)) {
    throw new Error(`Refusing to reuse existing release tag ${plan.tag}`)
  }

  // Human-readable trace on stderr; the caller routes stdout where it wants
  // (the workflow appends it to $GITHUB_OUTPUT).
  console.error(
    [
      `Channel:  ${env.CHANNEL}`,
      `Last GA:  ${lastGATag ?? '(none)'}`,
      `Bump:     ${plan.bump}`,
      `Version:  ${plan.version}`,
      `Tag:      ${plan.tag}`,
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
