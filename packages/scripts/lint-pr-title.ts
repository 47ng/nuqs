#!/usr/bin/env node

import { appendFileSync, readFileSync } from 'node:fs'
import { z } from 'zod'

// Matches the @commitlint/config-conventional default. If the project ever
// overrides header-max-length in package.json, update this constant.
export const HEADER_MAX_LENGTH = 100

const TITLE_FORMAT = /^([a-z]+)(?:\(([^)]+)\))?(!)?: (.+)$/

export type ParsedTitle = {
  type: string
  scope: string | undefined
  breaking: boolean
  subject: string
}

export function parseTitle(title: string): ParsedTitle | null {
  const m = title.match(TITLE_FORMAT)
  if (!m || !m[1] || !m[4]) return null
  return {
    type: m[1],
    scope: m[2],
    breaking: m[3] === '!',
    subject: m[4]
  }
}

// Validates only the subset of package.json we care about. The third tuple
// element is the rule's value per @commitlint/types — the first two slots
// (severity, applicable) are intentionally unconstrained here.
const PackageJsonSchema = z.object({
  commitlint: z.object({
    rules: z.object({
      'type-enum': z.tuple([z.unknown(), z.unknown(), z.array(z.string())])
    })
  })
})

export function readTypeEnum(packageJsonContents: string): string[] {
  const parsed = PackageJsonSchema.safeParse(JSON.parse(packageJsonContents))
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
  const parsed = parseTitle(title)
  if (!parsed) {
    errors.push('Title does not match `type(scope)?(!)?: subject` format')
  } else if (!allowedTypes.includes(parsed.type)) {
    errors.push(
      `Type \`${parsed.type}\` is not allowed. Allowed types: ${allowedTypes.join(', ')}`
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

function main(): void {
  const title = process.env.TITLE ?? ''
  const types = readTypeEnum(readFileSync('./package.json', 'utf8'))
  const errors = validateTitle(title, types)
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile) {
    appendFileSync(summaryFile, formatSummary(errors))
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(e)
    process.exit(1)
  }
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('lint-pr-title.ts')

if (isMainModule) {
  main()
}
