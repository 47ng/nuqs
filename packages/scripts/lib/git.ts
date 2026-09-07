import { execFileSync } from 'node:child_process'

export type ReleaseHistoryEntry = {
  hash: string
  parents: string[]
  message: string
  tags: string[]
}

// Shared, privileged git boundary for the release scripts.
//
// execFileSync (no shell): git arguments and commit content are never subject
// to shell interpretation, regardless of tag or commit message content. Both
// the version computer and the commit-graph engine read git through here so the
// shell-safety boundary lives in exactly one place.
export function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

// Version tags (`vX.Y.Z` and `vX.Y.Z-beta.N`) reachable from the release
// branch, trimmed and unsorted. Tags from unrelated branches are not release
// checkpoints for nuqs.
export function readAllTags(): string[] {
  return git(['tag', '--list', 'v*', '--merged', 'origin/next'])
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function tagExists(tag: string): boolean {
  return git(['tag', '--list', tag])
    .split('\n')
    .some(candidate => candidate === tag)
}

// Read the checked-out release snapshot as a commit graph. Tags stay attached to
// their commits, so consumers derive every range from one source of truth.
export function readReleaseHistory(repository?: string): ReleaseHistoryEntry[] {
  const args = [
    'log',
    '-z',
    'HEAD',
    '--decorate=full',
    '--decorate-refs=refs/tags/v*',
    '--format=%H%x00%P%x00%B%x00%D'
  ]
  const fields = git(repository ? ['-C', repository, ...args] : args).split(
    '\x00'
  )
  if (fields.at(-1) === '') fields.pop()
  if (fields.length % 4 !== 0) {
    throw new Error('Unexpected git log record shape')
  }

  const history: ReleaseHistoryEntry[] = []
  for (let index = 0; index < fields.length; index += 4) {
    const hash = fields[index]!
    const parents = fields[index + 1]!
    const message = fields[index + 2]!
    const decorations = fields[index + 3]!
    history.push({
      hash,
      parents: parents ? parents.split(' ') : [],
      message: message.trim(),
      tags: decorations
        .split(', ')
        .map(decoration => decoration.replace(/^tag: refs\/tags\//, ''))
        .filter(tag => tag.startsWith('v'))
    })
  }
  return history
}
