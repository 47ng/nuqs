import semver from 'semver'
import type { Bump } from './conventional-commits.ts'

// The single version vocabulary the release tools speak. semver is an
// implementation detail held behind this boundary: callers reason about tags,
// GA/beta channels, and precedence — never semver primitives. The lone leak is
// isValidSemver's name, kept deliberately so the guard reads honestly.

// Whether a tag parses as a semantic version (a leading `v` is accepted).
export function isValidSemver(tag: string): boolean {
  return semver.valid(tag) !== null
}

// A GA tag is a valid version with no prerelease segment (vX.Y.Z, not -beta.N).
export function isGA(tag: string): boolean {
  return isValidSemver(tag) && semver.prerelease(tag) === null
}

// A beta tag is a valid version whose prerelease is exactly `beta.<N>`, N a
// number (vX.Y.Z-beta.N) — the only shape `computeVersion` emits. A bare `-beta`,
// a non-numeric `-beta.x`, an extra segment `-beta.N.M`, or another prerelease id
// (`-rc`/`-alpha`) is not a channel we publish, so it is not a beta.
export function isBeta(tag: string): boolean {
  const pre = semver.prerelease(tag)
  return (
    pre !== null &&
    pre.length === 2 &&
    pre[0] === 'beta' &&
    typeof pre[1] === 'number'
  )
}

// Whether `tag` orders strictly before `ref` by semver precedence. Equal
// versions do not precede each other (so a tag never precedes itself).
export function precedes(tag: string, ref: string): boolean {
  return semver.lt(tag, ref)
}

// The greatest tag by semver precedence among the valid ones, or null when none
// qualify. The original string (incl. the `v` prefix) is preserved.
export function greatestTag(tags: string[]): string | null {
  const valid = tags.filter(isValidSemver)
  return valid.length > 0 ? valid.sort(semver.rcompare)[0]! : null
}

// The greatest GA tag, ignoring betas — i.e. the previous stable checkpoint.
export function greatestGATag(tags: string[]): string | null {
  return greatestTag(tags.filter(isGA))
}

// The highest existing -beta.N for an exact GA target (e.g. '1.3.0'), or 0 when
// none exist. Using the max (not a count) means the next beta can't collide
// even if earlier betas were deleted; and since a recomputed, higher target has
// no matching betas, the sequence naturally resets to 0 → next is 1.
export function highestBetaNumber(tags: string[], targetGA: string): number {
  let highest = 0
  for (const tag of tags) {
    if (!isValidSemver(tag)) continue
    const base = `${semver.major(tag)}.${semver.minor(tag)}.${semver.patch(tag)}`
    if (base !== targetGA) continue
    const pre = semver.prerelease(tag)
    if (pre?.[0] === 'beta' && typeof pre[1] === 'number' && pre[1] > highest) {
      highest = pre[1]
    }
  }
  return highest
}

// Increment a GA version (no `v` prefix) by a conventional-commit bump.
export function bumpGA(lastGA: string, bump: Bump): string {
  return semver.inc(lastGA, bump)!
}
