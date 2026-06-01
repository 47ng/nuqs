import { describe, expect, it } from 'vitest'
import { computeVersion, selectLastGATag } from './compute-version'

describe('selectLastGATag', () => {
  it('returns the highest GA tag, ignoring betas', () => {
    const tags = ['v1.2.3', 'v2.8.9', 'v2.7.3-beta.1', 'v2.8.0', 'v2.10.0']
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

describe('computeVersion', () => {
  it('bumps a patch for a fix commit on the stable channel', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'fix: a bug' }],
      tags: ['v1.2.3']
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
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'feat: a feature' }],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('bumps a major on a "!" breaking marker', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'feat(scope)!: a breaking feature' }],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('bumps a major on an uppercase BREAKING CHANGE footer', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [
        { subject: 'fix: a fix', body: 'BREAKING CHANGE: removed an API' }
      ],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('bumps a major on a BREAKING-CHANGE (hyphenated) footer', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [
        { subject: 'fix: a fix', body: 'BREAKING-CHANGE: removed an API' }
      ],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('ignores a lowercase "breaking change" in prose', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [
        {
          subject: 'feat: a feature',
          body: 'this is a breaking change in prose'
        }
      ],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('computes the first beta for a target with no existing betas', () => {
    const plan = computeVersion({
      channel: 'beta',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'feat: a feature' }],
      tags: ['v1.2.3']
    })
    expect(plan).toEqual({
      version: '1.3.0-beta.1',
      tag: 'v1.3.0-beta.1',
      distTag: 'beta',
      bump: 'minor'
    })
  })

  it('increments the beta counter past existing betas for the same target', () => {
    const plan = computeVersion({
      channel: 'beta',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'feat: a feature' }],
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.2']
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.3' })
  })

  it('resets the beta counter when the target recomputes higher', () => {
    // A feat lands after a patch-beta (v1.2.4-beta.1): the target is now the
    // minor v1.3.0, whose betas start fresh at 1.
    const plan = computeVersion({
      channel: 'beta',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'feat: a feature' }],
      tags: ['v1.2.3', 'v1.2.4-beta.1']
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.1' })
  })

  it('treats perf and revert as patch bumps', () => {
    expect(
      computeVersion({
        channel: 'stable',
        lastGATag: 'v1.2.3',
        commits: [{ subject: 'perf: speed up' }],
        tags: ['v1.2.3']
      })
    ).toMatchObject({ version: '1.2.4', bump: 'patch' })
    expect(
      computeVersion({
        channel: 'stable',
        lastGATag: 'v1.2.3',
        commits: [{ subject: 'revert: undo a change' }],
        tags: ['v1.2.3']
      })
    ).toMatchObject({ version: '1.2.4', bump: 'patch' })
  })

  it('takes the highest bump across a mix of commits', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [
        { subject: 'fix: a fix' },
        { subject: 'feat: a feature' },
        { subject: 'chore: housekeeping' }
      ],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('returns null when no commit triggers a bump', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: [{ subject: 'chore: deps' }, { subject: 'doc: typo' }],
      tags: ['v1.2.3']
    })
    expect(plan).toBeNull()
  })

  it('counts from 0.0.0 when there is no prior GA tag', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: null,
      commits: [{ subject: 'feat: first feature' }],
      tags: []
    })
    expect(plan).toMatchObject({ version: '0.1.0', bump: 'minor' })
  })
})
