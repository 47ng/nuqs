import { describe, expect, it } from 'vitest'
import {
  commentAndLabel,
  renderComment,
  resolveChannelInfo,
  shouldSkip,
  type IssueWriter,
  type Target
} from './release-finalize'

describe('resolveChannelInfo', () => {
  it('maps a GA tag to the 🚀 / @latest / released presentation', () => {
    expect(resolveChannelInfo('v1.2.3')).toEqual({
      channel: 'stable',
      emoji: '🚀',
      distTag: 'latest',
      label: 'released'
    })
  })

  it('maps a beta tag to the 🧪 / @beta / released on @beta presentation', () => {
    expect(resolveChannelInfo('v1.2.3-beta.4')).toEqual({
      channel: 'beta',
      emoji: '🧪',
      distTag: 'beta',
      label: 'released on @beta'
    })
  })
})

describe('renderComment', () => {
  it('renders a GA comment for a PR (🚀 / @latest, npmx + notes links, install snippet)', () => {
    expect(renderComment({ tag: 'v1.2.3', kind: 'PR' })).toBe(
      `🚀 This PR is included in nuqs@1.2.3

The release is available on:
- 📦 [npm package (@latest)](https://npmx.dev/package/nuqs/v/1.2.3)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3)

\`\`\`
pnpm add nuqs@1.2.3
\`\`\`
`
    )
  })

  it('renders a GA comment for an issue (kind switches to "issue")', () => {
    expect(renderComment({ tag: 'v1.2.3', kind: 'issue' })).toBe(
      `🚀 This issue is included in nuqs@1.2.3

The release is available on:
- 📦 [npm package (@latest)](https://npmx.dev/package/nuqs/v/1.2.3)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3)

\`\`\`
pnpm add nuqs@1.2.3
\`\`\`
`
    )
  })

  it('renders a beta comment for a PR (🧪 / @beta, version keeps the -beta suffix)', () => {
    expect(renderComment({ tag: 'v1.2.3-beta.4', kind: 'PR' })).toBe(
      `🧪 This PR is included in nuqs@1.2.3-beta.4

The release is available on:
- 📦 [npm package (@beta)](https://npmx.dev/package/nuqs/v/1.2.3-beta.4)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3-beta.4)

\`\`\`
pnpm add nuqs@1.2.3-beta.4
\`\`\`
`
    )
  })

  it('renders a beta comment for an issue', () => {
    expect(renderComment({ tag: 'v1.2.3-beta.4', kind: 'issue' })).toBe(
      `🧪 This issue is included in nuqs@1.2.3-beta.4

The release is available on:
- 📦 [npm package (@beta)](https://npmx.dev/package/nuqs/v/1.2.3-beta.4)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3-beta.4)

\`\`\`
pnpm add nuqs@1.2.3-beta.4
\`\`\`
`
    )
  })
})

describe('shouldSkip', () => {
  it('skips an issue already carrying this release’s channel label', () => {
    expect(shouldSkip(['bug', 'released'], 'released')).toBe(true)
  })

  it('does not skip an issue missing this release’s channel label', () => {
    expect(shouldSkip(['bug'], 'released')).toBe(false)
  })

  it('does not skip a beta-labelled issue when the GA label is the filter', () => {
    // A PR that rode betas carries `released on @beta`; the GA finalize uses
    // the `released` label, so it must still comment (different channel).
    expect(shouldSkip(['released on @beta'], 'released')).toBe(false)
  })
})

// A fake IssueWriter records every call and can be programmed to reject a
// specific (issue, op) with an HTTP-ish status — letting the loop's failure
// handling be exercised at the port boundary, with no octokit or network.
function makeFakeWriter(
  opts: {
    existingLabels?: Record<number, string[]>
    failOn?: Record<number, { op: Recorded['op']; status: number }>
  } = {}
) {
  const calls: Recorded[] = []
  function maybeThrow(number: number, op: Recorded['op']) {
    const failure = opts.failOn?.[number]
    if (failure && failure.op === op) {
      throw Object.assign(new Error(`simulated ${failure.status}`), {
        status: failure.status
      })
    }
  }
  const writer: IssueWriter = {
    async getLabels(number) {
      calls.push({ op: 'getLabels', number })
      maybeThrow(number, 'getLabels')
      return opts.existingLabels?.[number] ?? []
    },
    async comment(number) {
      calls.push({ op: 'comment', number })
      maybeThrow(number, 'comment')
    },
    async addLabel(number) {
      calls.push({ op: 'addLabel', number })
      maybeThrow(number, 'addLabel')
    }
  }
  return { writer, calls }
}

type Recorded = { op: 'getLabels' | 'comment' | 'addLabel'; number: number }

const gaInfo = resolveChannelInfo('v1.2.3') // label "released"
const twoTargets: Target[] = [
  { number: 1, kind: 'PR' },
  { number: 2, kind: 'issue' }
]

describe('commentAndLabel', () => {
  it('comments then labels every target, in target order', async () => {
    const { writer, calls } = makeFakeWriter()
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: twoTargets
    })
    expect(calls).toEqual([
      { op: 'getLabels', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'addLabel', number: 1 },
      { op: 'getLabels', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })

  it('skips a target already carrying this channel label (no comment, no label)', async () => {
    const { writer, calls } = makeFakeWriter({
      existingLabels: { 1: ['released'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: twoTargets
    })
    expect(calls).toEqual([
      { op: 'getLabels', number: 1 },
      { op: 'getLabels', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })

  it('still comments a beta-labelled target during a GA finalize', async () => {
    const { writer, calls } = makeFakeWriter({
      existingLabels: { 1: ['released on @beta'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    expect(calls).toEqual([
      { op: 'getLabels', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'addLabel', number: 1 }
    ])
  })

  it('skips a 404 (deleted issue) without failing, and processes the rest', async () => {
    const { writer, calls } = makeFakeWriter({
      failOn: { 1: { op: 'getLabels', status: 404 } }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: twoTargets
      })
    ).resolves.toBeUndefined()
    // #1 bailed at getLabels; #2 fully processed (never aborts mid-loop).
    expect(calls).toEqual([
      { op: 'getLabels', number: 1 },
      { op: 'getLabels', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })

  it('skips a throttling-survived 403 without failing the job', async () => {
    const { writer } = makeFakeWriter({
      failOn: { 1: { op: 'comment', status: 403 } }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: [{ number: 1, kind: 'PR' }]
      })
    ).resolves.toBeUndefined()
  })

  it('collects a recoverable error, processes the rest, then fails at the end', async () => {
    const { writer, calls } = makeFakeWriter({
      failOn: { 1: { op: 'comment', status: 500 } }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: twoTargets
      })
    ).rejects.toThrow(/re-run/)
    // #1 failed at comment (so no addLabel); #2 still fully processed.
    expect(calls).toEqual([
      { op: 'getLabels', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'getLabels', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })
})
