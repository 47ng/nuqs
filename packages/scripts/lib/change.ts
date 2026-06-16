// The `change` domain — the single source of truth for the atomic unit of a
// release, shared by the discovery engine (which produces changes), the release
// notes (which render them), and the changelog codec (which serializes them to
// the DTO and parses them back). The Zod schema is authoritative; the types are
// inferred from it, so a field added here flows to every surface.
//
// Pure and IO-free (only `zod`): the codec imports it without dragging in
// git/octokit, so any consumer of the codec stays IO-free too. Keep it that way.

import { z } from 'zod'

// A change sourced from a squashed pull request (the common case)
// identity is the PR number, `description` is the PR title as prose,
// `author` is the GitHub login (or null for a deleted account), and it
// carries the issue numbers it closes. Rendered as `#123 - …, by @login`.
export const squashedPRChangeSchema = z.object({
  source: z.literal('squashedPR'),
  prNumber: z.number().int().positive(),
  type: z.string().nullable(), // conventional-commit type, or null when none
  breaking: z.boolean(),
  description: z.string(), // the PR title, not the commit message's description
  author: z.string().nullable(), // GitHub login, or null for a deleted account
  closingIssues: z.array(z.number().int().positive())
})

// A change sourced from a direct commit with no PR (rare: a hotfix, a revert) —
// identity is the 8-char commit SHA, `description` is the commit subject as
// prose, `author` is the git author name as prose (not a GitHub login).
// Rendered as `abcd1234 - …, by Name`.
export const directCommitChangeSchema = z.object({
  source: z.literal('directCommit'),
  sha: z.string(),
  type: z.string().nullable(),
  breaking: z.boolean(),
  description: z.string(), // the commit subject
  author: z.string()
})

// In both, `type` and `breaking` come from the commit message, never a PR title:
// the source decides only identity, prose, credited author, and closing issues.
export const changeSchema = z.discriminatedUnion('source', [
  squashedPRChangeSchema,
  directCommitChangeSchema
])

// A release's full change list plus the humans to credit (GitHub logins.
export const releaseChangesSchema = z.object({
  changes: z.array(changeSchema),
  contributors: z.array(z.string())
})

export type SquashedPRChange = z.infer<typeof squashedPRChangeSchema>
export type DirectCommitChange = z.infer<typeof directCommitChangeSchema>
export type Change = z.infer<typeof changeSchema>
export type ReleaseChanges = z.infer<typeof releaseChangesSchema>
