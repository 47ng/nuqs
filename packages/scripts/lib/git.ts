import { execFileSync } from 'node:child_process'

// Shared, privileged git boundary for the release scripts.
//
// execFileSync (no shell): git arguments and commit content are never subject
// to shell interpretation, regardless of tag or commit message content. Both
// the version computer and the commit-graph engine read git through here so the
// shell-safety boundary lives in exactly one place.
export function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

// All version tags (`vX.Y.Z` and `vX.Y.Z-beta.N`), trimmed, unsorted.
export function readAllTags(): string[] {
  return git(['tag', '--list', 'v*'])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}
