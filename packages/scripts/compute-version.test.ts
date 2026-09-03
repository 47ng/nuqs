import { describe, expect, it } from 'vitest'
import {
  computeVersion,
  formatReleaseTrace,
  selectLastGATag,
  selectLastReleaseTag
} from './compute-version'
import type { ReleaseHistoryEntry } from './lib/git'

type FixtureEntry =
  { type: 'commit'; message: string } | { type: 'release'; tag: string }

const release = (tag: string): FixtureEntry => ({ type: 'release', tag })
const commit = (message: string): FixtureEntry => ({ type: 'commit', message })

function history(...entries: FixtureEntry[]): ReleaseHistoryEntry[] {
  const commits: ReleaseHistoryEntry[] = []
  for (const entry of entries) {
    if (entry.type === 'release') {
      const target = commits.at(-1)
      if (target) {
        target.tags.push(entry.tag)
      } else {
        commits.push({
          hash: 'commit-0',
          parents: [],
          message: 'chore: initial release',
          tags: [entry.tag]
        })
      }
      continue
    }

    commits.push({
      hash: `commit-${commits.length}`,
      parents: commits.length > 0 ? [commits.at(-1)!.hash] : [],
      message: entry.message,
      tags: []
    })
  }
  return commits
}

describe('selectLastGATag', () => {
  it('returns the highest GA tag, ignoring betas', () => {
    const tags = [
      'v1.2.3',
      'v2.8.9',
      'v2.7.3-beta.1',
      'v2.8.0',
      'v2.10.0',
      'v1.2.4'
    ]
    expect(selectLastGATag(tags)).toBe('v2.10.0')
  })

  it('ignores a beta even when it is the highest version', () => {
    const tags = ['v2.8.9', 'v2.9.0-beta.1']
    expect(selectLastGATag(tags)).toBe('v2.8.9')
  })

  it('returns null when there are no GA tags', () => {
    expect(selectLastGATag(['v1.0.0-beta.1', 'v1.0.0-beta.2'])).toBeNull()
    expect(selectLastGATag([])).toBeNull()
  })
})

describe('selectLastReleaseTag', () => {
  it('selects the greatest published tag for a beta', () => {
    expect(
      selectLastReleaseTag('beta', ['v1.2.3', 'v1.2.4-beta.1', 'v1.2.4-beta.2'])
    ).toBe('v1.2.4-beta.2')
  })

  it('selects a stable release over its own betas', () => {
    expect(
      selectLastReleaseTag('beta', ['v1.2.3', 'v1.2.4-beta.1', 'v1.2.4'])
    ).toBe('v1.2.4')
  })

  it('selects a beta for a higher target over the latest stable release', () => {
    expect(selectLastReleaseTag('beta', ['v1.2.4', 'v1.3.0-beta.1'])).toBe(
      'v1.3.0-beta.1'
    )
  })

  it('returns null when no release tags exist', () => {
    expect(selectLastReleaseTag('beta', [])).toBeNull()
    expect(selectLastReleaseTag('stable', [])).toBeNull()
  })

  it('selects the greatest GA tag for a stable release', () => {
    expect(selectLastReleaseTag('stable', ['v1.2.3', 'v1.2.4-beta.1'])).toBe(
      'v1.2.3'
    )
  })
})

describe('release trace', () => {
  it('shows the published release checkpoint used by a beta run', () => {
    const trace = formatReleaseTrace({
      channel: 'beta',
      lastGATag: 'v1.2.3',
      lastReleaseTag: 'v1.2.4-beta.1',
      plan: {
        version: '1.2.4-beta.2',
        tag: 'v1.2.4-beta.2',
        distTag: 'beta',
        bump: 'patch'
      }
    })

    expect(trace).toContain('Last release: v1.2.4-beta.1')
  })
})

describe('computeVersion', () => {
  it('bumps a patch for a fix commit on the stable channel', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(release('v1.2.3'), commit('fix: a bug'))
    })
    expect(plan).toEqual({
      version: '1.2.4',
      tag: 'v1.2.4',
      distTag: 'latest',
      bump: 'patch'
    })
  })

  it('bumps a minor for a feat commit', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(release('v1.2.3'), commit('feat: a feature'))
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('bumps a major (1.x -> 2.0.0) for a breaking commit', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        release('v1.2.3'),
        commit('feat(scope)!: a breaking feature')
      )
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('computes the first beta for a target with no existing betas', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(release('v1.2.3'), commit('feat: a feature'))
    })
    expect(plan).toEqual({
      version: '1.3.0-beta.1',
      tag: 'v1.3.0-beta.1',
      distTag: 'beta',
      bump: 'minor'
    })
  })

  it('increments the beta counter when a lower bump lands after it', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(
        release('v1.2.3'),
        commit('feat: a feature'),
        release('v1.3.0-beta.1'),
        commit('fix: another bug'),
        release('v1.3.0-beta.2'),
        commit('fix: a later bug')
      )
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.3' })
  })

  it('does not increment a beta for non-bumping commits after it', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(
        release('v1.2.3'),
        commit('fix: a bug'),
        release('v1.2.4-beta.1'),
        commit('chore: housekeeping')
      )
    })
    expect(plan).toBeNull()
  })

  it('promotes the cumulative beta target to stable', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        release('v1.2.3'),
        commit('fix: a bug'),
        release('v1.2.4-beta.1'),
        commit('chore: housekeeping')
      )
    })
    expect(plan).toMatchObject({ version: '1.2.4', bump: 'patch' })
  })

  it('excludes every ancestor of the latest GA tag', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        commit('feat!: already released'),
        commit('chore: release prep'),
        release('v2.0.0'),
        commit('fix: a new bug')
      )
    })
    expect(plan).toMatchObject({ version: '2.0.1', bump: 'patch' })
  })

  it('excludes ancestors from both sides of a tagged merge', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: [
        { hash: 'root', parents: [], message: 'chore: initial', tags: [] },
        {
          hash: 'left',
          parents: ['root'],
          message: 'fix: released fix',
          tags: []
        },
        {
          hash: 'right',
          parents: ['root'],
          message: 'feat: released feature',
          tags: []
        },
        {
          hash: 'merge',
          parents: ['left', 'right'],
          message: 'chore: stable release',
          tags: ['v2.0.0']
        },
        {
          hash: 'head',
          parents: ['merge'],
          message: 'fix: a new bug',
          tags: []
        }
      ]
    })
    expect(plan).toMatchObject({ version: '2.0.1', bump: 'patch' })
  })

  it('resets the beta counter when the target recomputes higher', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(
        release('v1.2.3'),
        commit('fix: a bug'),
        release('v1.2.4-beta.1'),
        commit('feat: a feature')
      )
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.1' })
  })

  it('increments the beta counter when the same bump lands after it', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(
        release('v1.2.3'),
        commit('feat: first feature'),
        release('v1.3.0-beta.1'),
        commit('feat: second feature')
      )
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.2' })
  })

  it('takes the highest bump across a mix of commits', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        release('v1.2.3'),
        commit('fix: a fix'),
        commit('feat: a feature'),
        commit('chore: housekeeping')
      )
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('returns null when no commit triggers a bump', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        release('v1.2.3'),
        commit('chore: deps'),
        commit('doc: typo')
      )
    })
    expect(plan).toBeNull()
  })

  it('does not bump on a malformed subject with no description', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(release('v1.2.3'), commit('feat:'))
    })
    expect(plan).toBeNull()
  })

  it('major-bumps on a BREAKING CHANGE body footer without a subject "!"', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(
        release('v1.2.3'),
        commit('fix: a fix\n\nBREAKING CHANGE: removed an API')
      )
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('counts from 0.0.0 when there is no prior GA tag', () => {
    const plan = computeVersion({
      channel: 'stable',
      history: history(commit('feat: first feature'))
    })
    expect(plan).toMatchObject({ version: '0.1.0', bump: 'minor' })
  })

  it('computes the first-ever beta from 0.0.0', () => {
    const plan = computeVersion({
      channel: 'beta',
      history: history(commit('feat: first feature'))
    })
    expect(plan).toEqual({
      version: '0.1.0-beta.1',
      tag: 'v0.1.0-beta.1',
      distTag: 'beta',
      bump: 'minor'
    })
  })
})
