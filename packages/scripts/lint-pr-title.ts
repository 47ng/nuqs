#!/usr/bin/env node

import { createEnv } from '@t3-oss/env-core'
import { appendFileSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import { classify } from './lib/conventional-commits.ts'

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

function main(): void {
  const env = createEnv({
    server: {
      TITLE: z.string(),
      GITHUB_STEP_SUMMARY: z.string().optional()
    },
    isServer: true,
    runtimeEnv: process.env
  })
  const types = readTypeEnum(readFileSync('./package.json', 'utf8'))
  const errors = validateTitle(env.TITLE, types)
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, formatSummary(errors))
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(e)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
