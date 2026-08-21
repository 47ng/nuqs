// The `change` domain — the single source of truth for the atomic unit of a
// release, shared by the discovery engine (which produces changes), the release
// notes (which render them), and the changelog codec (which serializes them to
// the DTO and parses them back). The Zod schema is authoritative; the types are
// inferred from it, so a field added here flows to every surface.
//
// Pure and IO-free (only `zod`): the codec imports it without dragging in
// git/octokit, so any consumer of the codec stays IO-free too. Keep it that way.

import { z } from 'zod'

const githubLoginSchema = z
  .string()
  .regex(/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/)

// A change description (a PR title or a commit subject): non-empty and bounded.
const descriptionSchema = z.string().min(1).max(500)

const shaSchema = z.string().regex(/^[0-9a-f]{7,40}$/)

// A change sourced from a squashed pull request (the common case):
// identity is the PR number, `description` is the PR title as prose,
// `author` is the GitHub login (or null for a deleted account), and it
// carries the issue numbers it closes. Rendered as `#123 - …, by @login`.
export const squashedPRChangeSchema = z.strictObject({
  source: z.literal('squashedPR'),
  prNumber: z.number().int().positive(),
  type: z.string().nullable(), // conventional-commit type, or null when none
  breaking: z.boolean(),
  description: descriptionSchema, // the PR title
  author: githubLoginSchema.nullable(), // null for a deleted account
  closingIssues: z.array(z.number().int().positive())
})

// A change sourced from a direct commit with no PR (rare: a hotfix, a revert)
export const directCommitChangeSchema = z.strictObject({
  source: z.literal('directCommit'),
  sha: shaSchema,
  type: z.string().nullable(),
  breaking: z.boolean(),
  description: descriptionSchema, // the commit subject
  author: z.string().min(1) // git author name (free prose, not a login)
})

// In both, `type` and `breaking` come from the commit message, never a PR title:
// the source decides only identity, prose, credited author, and closing issues.
export const changeSchema = z.discriminatedUnion('source', [
  squashedPRChangeSchema,
  directCommitChangeSchema
])

// A release's full change list plus the humans to credit (GitHub logins).
export const releaseChangesSchema = z.strictObject({
  changes: z.array(changeSchema),
  contributors: z.array(githubLoginSchema)
})

export type SquashedPRChange = z.infer<typeof squashedPRChangeSchema>
export type DirectCommitChange = z.infer<typeof directCommitChangeSchema>
export type Change = z.infer<typeof changeSchema>
export type ReleaseChanges = z.infer<typeof releaseChangesSchema>
