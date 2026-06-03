#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { execFileSync } from 'node:child_process'
import { z } from 'zod'
import { type Bump, classify } from './lib/conventional-commits.ts'

export type Channel = 'stable' | 'beta'
export type ReleasePlan = {
  version: string
  tag: string
  distTag: 'latest' | 'beta'
  bump: Bump
}

const RANKS: Record<Bump, number> = { major: 3, minor: 2, patch: 1 }

// Returns the highest GA tag (e.g. "v2.10.0"), ignoring -beta.* tags, or
// null when there are no GA tags. Comparison is numeric, so v2.10.0 sorts
// above v2.8.9.
export function selectLastGATag(tags: string[]): string | null {
  let best: { tag: string; parts: number[] } | null = null
  for (const tag of tags) {
    const match = tag.match(/^v(\d+)\.(\d+)\.(\d+)$/)
    if (!match) continue
    const parts = [Number(match[1]), Number(match[2]), Number(match[3])]
    if (best === null || compareParts(parts, best.parts) > 0) {
      best = { tag, parts }
    }
  }
  return best?.tag ?? null
}

function compareParts(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function highestBump(commits: string[]): Bump | null {
  let highest: Bump | null = null
  for (const commit of commits) {
    const { bump } = classify(commit)
    if (bump && (highest === null || RANKS[bump] > RANKS[highest])) {
      highest = bump
    }
  }
  return highest
}

function incrementGA(version: string, bump: Bump): string {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number)
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
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
  const targetGA = incrementGA(lastGA, bump)

  if (args.channel === 'stable') {
    return { version: targetGA, tag: `v${targetGA}`, distTag: 'latest', bump }
  }

  const next = highestBetaNumber(args.tags, targetGA) + 1
  const version = `${targetGA}-beta.${next}`
  return { version, tag: `v${version}`, distTag: 'beta', bump }
}

// One past the highest existing beta number for THIS exact target. Using the
// max (not a count) guarantees the new tag can't collide with an existing one
// even if earlier betas were deleted; and since a recomputed, higher target
// has no matching betas, the sequence naturally resets to 1.
function highestBetaNumber(tags: string[], targetGA: string): number {
  const prefix = `v${targetGA}-beta.`
  let highest = 0
  for (const tag of tags) {
    if (!tag.startsWith(prefix)) continue
    const suffix = tag.slice(prefix.length)
    if (!/^\d+$/.test(suffix)) continue // only canonical -beta.N tags
    const n = Number(suffix)
    if (n > highest) highest = n
  }
  return highest
}

// --- IO layer (untested by design: the pure core above is the unit) -------

// execFileSync (no shell) so git arguments are never subject to shell
// interpretation, regardless of tag or commit content.
function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function readAllTags(): string[] {
  return git(['tag', '--list', 'v*'])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

// Commit messages reach the parser only through git's stdout — never a
// shell — so a crafted message cannot inject commands. Each record is a full
// message (subject + body, %B) split on \x1e, which cannot occur in a message.
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
