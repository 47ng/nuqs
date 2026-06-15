import { describe, expect, it } from 'vitest'
import { computeVersion, selectLastGATag } from './compute-version'

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

describe('computeVersion', () => {
  it('bumps a patch for a fix commit on the stable channel', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['fix: a bug'],
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
      commits: ['feat: a feature'],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('bumps a major (1.x -> 2.0.0) for a breaking commit', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['feat(scope)!: a breaking feature'],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('computes the first beta for a target with no existing betas', () => {
    const plan = computeVersion({
      channel: 'beta',
      lastGATag: 'v1.2.3',
      commits: ['feat: a feature'],
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
      commits: ['feat: a feature'],
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
      commits: ['feat: a feature'],
      tags: ['v1.2.3', 'v1.2.4-beta.1']
    })
    expect(plan).toMatchObject({ version: '1.3.0-beta.1' })
  })

  it('takes the highest bump across a mix of commits', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['fix: a fix', 'feat: a feature', 'chore: housekeeping'],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '1.3.0', bump: 'minor' })
  })

  it('returns null when no commit triggers a bump', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['chore: deps', 'doc: typo'],
      tags: ['v1.2.3']
    })
    expect(plan).toBeNull()
  })

  it('does not bump on a malformed subject with no description', () => {
    // A conventional subject requires a description; a bare `feat:` (which
    // commitlint's subject-empty rule rejects at commit time anyway) is not a
    // valid bump trigger and must not produce a release.
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['feat:'],
      tags: ['v1.2.3']
    })
    expect(plan).toBeNull()
  })

  it('major-bumps on a BREAKING CHANGE body footer even without a subject "!"', () => {
    // Per Conventional Commits, the footer is an equivalent breaking trigger. A
    // fix carrying the footer bumps major (1.x -> 2.0.0), so a footer-only break
    // never silently ships as a patch.
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: 'v1.2.3',
      commits: ['fix: a fix\n\nBREAKING CHANGE: removed an API'],
      tags: ['v1.2.3']
    })
    expect(plan).toMatchObject({ version: '2.0.0', bump: 'major' })
  })

  it('counts from 0.0.0 when there is no prior GA tag', () => {
    const plan = computeVersion({
      channel: 'stable',
      lastGATag: null,
      commits: ['feat: first feature'],
      tags: []
    })
    expect(plan).toMatchObject({ version: '0.1.0', bump: 'minor' })
  })

  it('computes the first-ever beta (no GA tag, no betas) from 0.0.0', () => {
    const plan = computeVersion({
      channel: 'beta',
      lastGATag: null,
      commits: ['feat: first feature'],
      tags: []
    })
    expect(plan).toEqual({
      version: '0.1.0-beta.1',
      tag: 'v0.1.0-beta.1',
      distTag: 'beta',
      bump: 'minor'
    })
  })
})
