#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { appendFileSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import { classify } from './lib/conventional-commits.ts'

// --- PR title format / type / length -----------------------------------------

// Matches the @commitlint/config-conventional default. If the project ever
// overrides header-max-length in package.json, update this constant.
export const HEADER_MAX_LENGTH = 100

// Validates only the subset of package.json we care about. The third tuple
// element is the rule's value per @commitlint/types — the first two slots
// (severity, applicable) are intentionally unconstrained here.
const packageJsonSchema = z.object({
  commitlint: z.object({
    rules: z.object({
      'type-enum': z.tuple([z.unknown(), z.unknown(), z.array(z.string())])
    })
  })
})

export function readTypeEnum(packageJsonContents: string): string[] {
  const parsed = packageJsonSchema.safeParse(JSON.parse(packageJsonContents))
  if (!parsed.success) {
    throw new Error('package.json missing commitlint.rules.type-enum string[]')
  }
  return parsed.data.commitlint.rules['type-enum'][2]
}

export function validateTitle(
  title: string,
  allowedTypes: string[],
  maxLen: number = HEADER_MAX_LENGTH
): string[] {
  const errors: string[] = []
  const { type } = classify(title)
  if (type === undefined) {
    errors.push('Title does not match `type(scope)?(!)?: subject` format')
  } else if (!allowedTypes.includes(type)) {
    errors.push(
      `Type \`${type}\` is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    )
  }
  if (title.length > maxLen) {
    errors.push(`Title exceeds ${maxLen} characters (got ${title.length})`)
  }
  return errors
}

export function formatSummary(errors: string[]): string {
  if (errors.length === 0) {
    return '## ✅ PR Title Lint\n- Valid\n'
  }
  return `## ❌ PR Title Lint\n${errors.map(e => `- ${e}`).join('\n')}\n`
}

// --- Version-bump consistency -------------------------------------------------
// A version-bumping title (feat/fix/perf/revert) must touch the core package,
// otherwise the release it triggers ships no library change.

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

// --- Entrypoint ---------------------------------------------------------------

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

  function writeSummary(markdown: string) {
    if (env.GITHUB_STEP_SUMMARY) {
      appendFileSync(env.GITHUB_STEP_SUMMARY, markdown)
    }
  }

  // 1. The title must be a well-formed, allowed conventional-commit header.
  //    A malformed title makes the bump classification meaningless, so we
  //    stop here rather than reporting a second, derived failure.
  const types = readTypeEnum(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  )
  const titleErrors = validateTitle(env.TITLE, types)
  writeSummary(formatSummary(titleErrors))
  if (titleErrors.length > 0) {
    for (const e of titleErrors) console.error(e)
    process.exit(1)
  }

  // 2. A version-bumping title must include changes to the core package.
  const { bump, type } = classify(env.TITLE)
  if (bump === null) {
    console.log(
      `Commit type \`${type ?? '(none)'}\` does not trigger a version bump. Skipping core package check.`
    )
    return
  }
  console.log(
    `Commit type \`${type}\` triggers a version bump. Checking for changes in ${CORE_PACKAGE_PREFIX}...`
  )
  const files = parseChangedFiles(env.CHANGED_FILES)
  if (hasCoreChanges(files)) {
    writeSummary(formatPassSummary(type))
    return
  }
  writeSummary(formatFailSummary(type))
  console.error(
    `Error: PR title uses version-bumping type "${type}" but contains no changes in ${CORE_PACKAGE_PREFIX}`
  )
  console.error(`Changed files: ${files.join(', ')}`)
  console.error(
    `\nPlease use a non-bumping commit type: ${NON_BUMPING_TYPES.join(', ')}`
  )
  process.exit(1)
}

if (import.meta.main) {
  main()
}
