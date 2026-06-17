// Shared changelog codec — the single source of truth for the machine-readable
// DTO embedded in each GitHub release body (inside an HTML comment) and parsed
// back out of it. The release pipeline (`release-notes-automation.ts`) serializes
// a `ReleaseChanges`; whatever renders the changelog parses it back.
//
// Pure and IO-free by contract: it touches only `zod` and the `change.ts` schema
// SSOT, never the git/octokit IO in `commit-graph.ts`, so it can be imported from
// anywhere. Keep it that way — a value import from `commit-graph.ts`/`git.ts`
// here would pull `node:child_process` and octokit into every consumer.

import { z } from 'zod'
import {
  type Change,
  type ReleaseChanges,
  releaseChangesSchema
} from './change.ts'

// Re-export the change-domain types so consumers have a single import site for
// the changelog shapes.
export type { Change, ReleaseChanges } from './change.ts'

// Branded, stable, versioned identity for the DTO. A `z.literal`, so a future
// breaking `v2` URL simply fails `parse` → the consumer degrades that release,
// with no version branching anywhere. The matching JSON Schema artifact served
// at this URL (for out-of-band/editor validation) is generated in a later slice;
// runtime validation is always Zod, never a fetch of this URL.
export const CHANGELOG_DTO_SCHEMA_URL =
  'https://nuqs.dev/schemas/changelog-dto.v1.json'

// --- DTO schema -------------------------------------------------------------

// The DTO is a release's changes plus a `$schema` tag — the serialized form is
// the exact `ReleaseChanges` shape, so wire and domain can't drift. `category`
// is intentionally never stored: it is derived from each change's `type` at
// render via `categoryForType`, so a future mapping change re-buckets every
// release consistently.
export const changelogDtoSchema = releaseChangesSchema.extend({
  $schema: z.literal(CHANGELOG_DTO_SCHEMA_URL)
})

export type ChangelogDTO = z.infer<typeof changelogDtoSchema>

// Serialize a release into the DTO: its changes verbatim, tagged with `$schema`.
export function toChangelogDTO(release: ReleaseChanges): ChangelogDTO {
  return { $schema: CHANGELOG_DTO_SCHEMA_URL, ...release }
}

// The JSON Schema artifact (Draft 2020-12) derived from the Zod SSOT. Served
// out-of-band at `CHANGELOG_DTO_SCHEMA_URL` for editor/tooling validation —
// consumers never fetch it and validate at runtime with Zod, never this. The
// derivation lives here, beside the schema, so the throwaway generator (which
// writes the committed artifact) and the drift test (which guards it) share one
// source and cannot disagree about what the artifact should contain.
export function changelogJsonSchema() {
  return z.toJSONSchema(changelogDtoSchema)
}

// --- Embedding: the HTML comment block --------------------------------------

const HINT =
  'Any Markdown between the preamble tags is rendered on the changelog page:'
const PREAMBLE_OPEN = '<changelog:preamble>'
const PREAMBLE_CLOSE = '</changelog:preamble>'
const DTO_OPEN = '<changelog:dto>'
const DTO_CLOSE = '</changelog:dto>'
const COMMENT_OPEN = '<!--'
const COMMENT_END = '-->'

// Neutralize every `<` and `>` in the embedded JSON so it can neither close the
// HTML comment (`-->`) nor the `</changelog:dto>` tag, nor smuggle any other
// markup into the body. Both are valid JSON escapes that `JSON.parse` decodes
// back to the exact characters, so the round-trip needs no custom unescape — the
// escaping is invisible to every consumer except the raw comment text.
function escapeForComment(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
}

// Serialize a release's changes into the one HTML comment block carried by the
// release body: a guiding hint line, an (empty) preamble stub, and the DTO as
// pretty-printed, `<`/`>`-escaped JSON. The hint sits outside the preamble tags,
// so GitHub hides the whole comment and the renderer ignores the hint.
export function renderChangelogComment(release: ReleaseChanges): string {
  const json = escapeForComment(
    JSON.stringify(toChangelogDTO(release), null, 2)
  )
  return [
    COMMENT_OPEN,
    HINT,
    `${PREAMBLE_OPEN}${PREAMBLE_CLOSE}`,
    DTO_OPEN,
    json,
    DTO_CLOSE,
    COMMENT_END
  ].join('\n')
}

// The substring between the first `open` and the next `close` after it, or null
// when either marker is absent. The escaped JSON contains no `<`/`>`, so the
// `</changelog:dto>` match is unambiguous regardless of the change descriptions.
function extractBetween(
  body: string,
  open: string,
  close: string
): string | null {
  const start = body.indexOf(open)
  if (start === -1) return null
  const from = start + open.length
  const end = body.indexOf(close, from)
  if (end === -1) return null
  return body.slice(from, end)
}

// The outcome of parsing a release body, distinguishing the two cases the old
// single `null` conflated:
//   - `absent`  — no `<changelog:dto>` block at all (a legitimate pre-DTO or
//     hand-written release): degrade quietly.
//   - `invalid` — the block is present but its JSON is malformed or fails the
//     schema (incl. an unrecognized `$schema`): the signature of a tampered body
//     or a pipeline schema drift. Degrade too, but loudly, carrying the `reason`.
export type ParsedChangelog =
  | { status: 'ok'; preamble: string | null; dto: ChangelogDTO }
  | { status: 'absent' }
  | { status: 'invalid'; reason: string }

// Extract + Zod-validate the DTO (and optional preamble) from a release body.
// Never throws: every parse/validation failure is reported as `absent`/`invalid`
// so a renderer can always degrade a single release rather than fail the build.
export function parseChangelogComment(body: string | null): ParsedChangelog {
  if (!body) return { status: 'absent' }
  const dtoText = extractBetween(body, DTO_OPEN, DTO_CLOSE)
  if (dtoText === null) return { status: 'absent' }
  let json: unknown
  try {
    json = JSON.parse(dtoText)
  } catch (error) {
    return {
      status: 'invalid',
      reason: `malformed JSON: ${(error as Error).message}`
    }
  }
  const result = changelogDtoSchema.safeParse(json)
  if (!result.success) {
    const reason = result.error.issues
      .map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
    return { status: 'invalid', reason }
  }
  const rawPreamble = extractBetween(body, PREAMBLE_OPEN, PREAMBLE_CLOSE)
  const trimmed = rawPreamble?.trim() ?? ''
  return {
    status: 'ok',
    preamble: trimmed.length > 0 ? trimmed : null,
    dto: result.data
  }
}

// Remove the appended changelog comment from a release body — for surfaces that
// render the human-readable notes verbatim and must not leak the machine DTO.
// A no-op when the comment is absent. Anchors on the
// single-line `<changelog:dto>` tag (not a multi-line literal), so it is
// line-ending agnostic: the enclosing comment is the nearest `<!--` before the
// tag and the next `-->` after it (the escaped DTO contains no `-->`), which
// also skips any earlier `<!-- … -->` in the human notes (e.g. a migration stub).
export function stripChangelogComment(body: string): string {
  const dtoIndex = body.indexOf(DTO_OPEN)
  if (dtoIndex === -1) return body
  const start = body.lastIndexOf(COMMENT_OPEN, dtoIndex)
  const end = body.indexOf(COMMENT_END, dtoIndex)
  if (start === -1 || end === -1) return body
  return (body.slice(0, start) + body.slice(end + COMMENT_END.length)).trimEnd()
}

// --- Shared span-parser -----------------------------------------------------

// One segment of a change description: plain text, or an inline-code run.
type DescriptionSegment = { code: boolean; value: string }

// Split a description into plain-text and inline-code segments on *balanced*
// backtick pairs (a lone backtick stays literal text). This is the single
// primitive both renderers build on — the GitHub notes' `<code>` HTML
// (`formatTitle`) and any consumer rendering inline code as nodes — so a
// description stored raw in the DTO can't diverge between surfaces.
export function parseCodeSpans(text: string): DescriptionSegment[] {
  const segments: DescriptionSegment[] = []
  const pattern = /`([^`]+)`/g
  let lastIndex = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      segments.push({ code: false, value: text.slice(lastIndex, start) })
    }
    segments.push({ code: true, value: match[1]! })
    lastIndex = start + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ code: false, value: text.slice(lastIndex) })
  }
  return segments
}

// --- Shared category derivation + grouping ----------------------------------

export const CATEGORIES = [
  'Features',
  'Bug fixes',
  'Documentation',
  'Other changes'
] as const
export type Category = (typeof CATEGORIES)[number]

// Derive a change's changelog category from its commit `type` — never a PR
// title, whose prefix is irrelevant prose. `null` (a non-conventional commit)
// falls through to "Other changes". (Also tolerates `undefined` for callers
// holding a not-yet-encoded parse result.)
export function categoryForType(type: string | null | undefined): Category {
  switch (type) {
    case 'feat':
      return 'Features'
    case 'fix':
      return 'Bug fixes'
    case 'doc':
    case 'docs':
      return 'Documentation'
    default:
      return 'Other changes'
  }
}

// Order within a section: PR-sourced changes first (ascending PR number), then
// direct-commit changes in their given order (discovery supplies them
// oldest-first). Relies on a stable sort to preserve that commit order.
function compareChanges(a: Change, b: Change): number {
  if (a.source !== b.source) return a.source === 'squashedPR' ? -1 : 1
  if (a.source === 'squashedPR' && b.source === 'squashedPR') {
    return a.prNumber - b.prNumber
  }
  return 0
}

// Group changes into their changelog categories. The category is the bucket key,
// not a field on the change, so the two can't drift.
export function groupChangesByCategory(
  changes: readonly Change[]
): Record<Category, Change[]> {
  const categories: Record<Category, Change[]> = {
    Features: [],
    'Bug fixes': [],
    Documentation: [],
    'Other changes': []
  }
  for (const change of changes) {
    categories[categoryForType(change.type)].push(change)
  }
  for (const category of CATEGORIES) {
    categories[category].sort(compareChanges)
  }
  return categories
}

// The breaking-changes cross-cut: every change flagged `breaking`, in the same
// PR-first / commit-oldest order. A filter over `breaking`, NOT a category — a
// `feat!` stays in its type section and also appears here.
export function breakingChanges(changes: readonly Change[]): Change[] {
  return changes.filter(change => change.breaking).sort(compareChanges)
}
