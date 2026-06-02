#!/usr/bin/env node

import { appendFileSync } from 'node:fs'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'
import { classify } from './lib/conventional-commits'

export const NON_BUMPING_TYPES = [
  'build',
  'chore',
  'ci',
  'clean',
  'doc',
  'ref',
  'style',
  'test'
] as const

export const CORE_PACKAGE_PREFIX = 'packages/nuqs/'

export function hasCoreChanges(files: string[]): boolean {
  return files.some(f => f.startsWith(CORE_PACKAGE_PREFIX))
}

export function parseChangedFiles(raw: string): string[] {
  // The workflow emits one filename per line (NUL-delimited from git, then
  // converted to newlines for $GITHUB_OUTPUT). Newlines are not legal in
  // filenames on the filesystems we care about, so splitting on '\n' is the
  // unambiguous choice and survives whitespace-in-filenames.
  return raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

export function formatPassSummary(type: string): string {
  const corePath = CORE_PACKAGE_PREFIX.replace(/\/$/, '')
  return `## ✅ Version Bump Check Passed\n\nCommit type \`${type}\` is valid because the PR includes changes to \`${corePath}\`.\n`
}

export function formatFailSummary(type: string): string {
  const corePath = CORE_PACKAGE_PREFIX.replace(/\/$/, '')
  return [
    `## ❌ Version Bump Check Failed`,
    ``,
    `Your PR title uses the commit type **\`${type}\`** which triggers a version bump, but no changes were found in the core package (\`${corePath}\`).`,
    ``,
    `### What to do:`,
    ``,
    `If this PR does not include changes to the core \`nuqs\` package, please use a non-bumping commit type instead:`,
    ``,
    `| Type | Use for |`,
    `|------|---------|`,
    `| \`doc\` | Documentation updates |`,
    `| \`chore\` | Maintenance, CI/CD, dependencies |`,
    `| \`test\` | Test additions or modifications |`,
    `| \`ci\` | CI configuration changes |`,
    `| \`build\` | Build system changes |`,
    `| \`style\` | Code style/formatting |`,
    `| \`ref\` | Refactoring (non-core) |`,
    ``,
    `### Version-bumping types (require core package changes):`,
    `- \`feat\` → minor version bump`,
    `- \`fix\` → patch version bump`,
    `- \`perf\` → patch version bump`,
    `- \`revert\` → depends on reverted commit`,
    ``
  ].join('\n')
}

function main(): void {
  const env = createEnv({
    server: {
      TITLE: z.string(),
      CHANGED_FILES: z.string().default(''),
      GITHUB_STEP_SUMMARY: z.string().optional()
    },
    isServer: true,
    runtimeEnv: process.env
  })
  const { bump, type } = classify(env.TITLE)

  if (bump === null) {
    console.log(
      `Commit type \`${type ?? '(none)'}\` does not trigger a version bump. Skipping core package check.`
    )
    process.exit(0)
  }

  console.log(
    `Commit type \`${type}\` triggers a version bump. Checking for changes in ${CORE_PACKAGE_PREFIX}...`
  )

  const files = parseChangedFiles(env.CHANGED_FILES)
  if (hasCoreChanges(files)) {
    if (env.GITHUB_STEP_SUMMARY) {
      appendFileSync(env.GITHUB_STEP_SUMMARY, formatPassSummary(type))
    }
    process.exit(0)
  }

  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, formatFailSummary(type))
  }
  console.error(
    `Error: PR title uses version-bumping type "${type}" but contains no changes in ${CORE_PACKAGE_PREFIX}`
  )
  console.error(`Changed files: ${files.join(', ')}`)
  console.error(
    `\nPlease use a non-bumping commit type: ${NON_BUMPING_TYPES.join(', ')}`
  )
  process.exit(1)
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-version-bump.ts')

if (isMainModule) {
  main()
}
