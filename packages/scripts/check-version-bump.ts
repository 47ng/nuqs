#!/usr/bin/env node

import { appendFileSync } from 'node:fs'

export const BUMPING_TYPES = ['feat', 'fix', 'perf', 'revert'] as const
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

export type BumpingType = (typeof BUMPING_TYPES)[number]

export const CORE_PACKAGE_PREFIX = 'packages/nuqs/'

export function extractType(title: string): string | undefined {
  return title.match(/^([a-z]+)/)?.[1]
}

export function isVersionBumping(
  type: string | undefined
): type is BumpingType {
  return (
    type !== undefined && (BUMPING_TYPES as readonly string[]).includes(type)
  )
}

export function hasCoreChanges(files: string[]): boolean {
  return files.some(f => f.startsWith(CORE_PACKAGE_PREFIX))
}

export function parseChangedFiles(raw: string): string[] {
  return raw.trim().split(' ').filter(Boolean)
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
  const title = process.env.TITLE ?? ''
  const changedRaw = process.env.CHANGED_FILES ?? ''
  const type = extractType(title)
  const summaryFile = process.env.GITHUB_STEP_SUMMARY

  if (!isVersionBumping(type)) {
    console.log(
      `Commit type \`${type ?? '(none)'}\` does not trigger a version bump. Skipping core package check.`
    )
    process.exit(0)
  }

  console.log(
    `Commit type \`${type}\` triggers a version bump. Checking for changes in ${CORE_PACKAGE_PREFIX}...`
  )

  const files = parseChangedFiles(changedRaw)
  if (hasCoreChanges(files)) {
    if (summaryFile) {
      appendFileSync(summaryFile, formatPassSummary(type))
    }
    process.exit(0)
  }

  if (summaryFile) {
    appendFileSync(summaryFile, formatFailSummary(type))
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
