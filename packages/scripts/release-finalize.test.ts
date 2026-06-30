import { RequestError } from 'octokit'
import { describe, expect, it, vi } from 'vitest'
import {
  commentAndLabel,
  hasReleaseComment,
  releaseMarker,
  renderComment,
  resolveChannelInfo,
  type Target,
  type TargetWriter,
  type ThreadComment
} from './release-finalize'

// The login finalize comments author as: the GitHub Actions app (the CI
// GITHUB_TOKEN identity). Finalize reads threads over GraphQL, which returns the
// bare `github-actions` — the value that actually reaches the guard at runtime, so
// it's the one the fixtures use. (REST spells the same actor `github-actions[bot]`;
// the guard accepts both — see githubActionsBotRest.)
const githubActionsBot = 'github-actions'
const githubActionsBotRest = 'github-actions[bot]'

describe('releaseMarker', () => {
  it('keys the marker by release version (GA tag, no leading v)', () => {
    expect(releaseMarker('v1.2.3')).toBe('<!-- release-finalize:nuqs@1.2.3 -->')
  })

  it('keeps the -beta suffix so betas and GAs get distinct markers', () => {
    expect(releaseMarker('v1.2.3-beta.4')).toBe(
      '<!-- release-finalize:nuqs@1.2.3-beta.4 -->'
    )
  })
})

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

<!-- release-finalize:nuqs@1.2.3 -->
`
    )
  })

  it('renders a GA comment for an issue (kind switches to "issue")', () => {
    expect(renderComment({ tag: 'v1.2.3', kind: 'issue' })).toBe(
      `🚀 This issue is resolved in nuqs@1.2.3

The release is available on:
- 📦 [npm package (@latest)](https://npmx.dev/package/nuqs/v/1.2.3)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3)

\`\`\`
pnpm add nuqs@1.2.3
\`\`\`

<!-- release-finalize:nuqs@1.2.3 -->
`
    )
  })

  it('renders a GA comment for a discussion (kind switches to "discussion is addressed")', () => {
    expect(renderComment({ tag: 'v1.2.3', kind: 'discussion' })).toBe(
      `🚀 This discussion is addressed in nuqs@1.2.3

The release is available on:
- 📦 [npm package (@latest)](https://npmx.dev/package/nuqs/v/1.2.3)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3)

\`\`\`
pnpm add nuqs@1.2.3
\`\`\`

<!-- release-finalize:nuqs@1.2.3 -->
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

> Please try out beta & pre-releases, it's the best moment for your feedback to be heard. -- [TkDodo](https://youtu.be/l3PxErcKeAI?t=1725)

<!-- release-finalize:nuqs@1.2.3-beta.4 -->
`
    )
  })

  it('renders a beta comment for an issue', () => {
    expect(renderComment({ tag: 'v1.2.3-beta.4', kind: 'issue' })).toBe(
      `🧪 This issue is resolved in nuqs@1.2.3-beta.4

The release is available on:
- 📦 [npm package (@beta)](https://npmx.dev/package/nuqs/v/1.2.3-beta.4)
- 📝 [Release notes](https://github.com/47ng/nuqs/releases/tag/v1.2.3-beta.4)

\`\`\`
pnpm add nuqs@1.2.3-beta.4
\`\`\`

> Please try out beta & pre-releases, it's the best moment for your feedback to be heard. -- [TkDodo](https://youtu.be/l3PxErcKeAI?t=1725)

<!-- release-finalize:nuqs@1.2.3-beta.4 -->
`
    )
  })
})

describe('hasReleaseComment', () => {
  const marker = releaseMarker('v1.2.3')

  it("returns true when the bot has posted a comment bearing this release's marker", () => {
    const comments: ThreadComment[] = [
      { author: githubActionsBot, body: `done\n${marker}\n` }
    ]
    expect(hasReleaseComment(comments, marker)).toBe(true)
  })

  it('also accepts the REST [bot] form of the bot login (dual-convention guard)', () => {
    const comments: ThreadComment[] = [
      { author: githubActionsBotRest, body: `done\n${marker}\n` }
    ]
    expect(hasReleaseComment(comments, marker)).toBe(true)
  })

  it('matches the bot login case-insensitively', () => {
    const comments: ThreadComment[] = [
      { author: 'GitHub-Actions', body: `done\n${marker}\n` }
    ]
    expect(hasReleaseComment(comments, marker)).toBe(true)
  })

  it('returns false when no comment carries the marker', () => {
    const comments: ThreadComment[] = [
      { author: githubActionsBot, body: 'unrelated chatter' }
    ]
    expect(hasReleaseComment(comments, marker)).toBe(false)
  })

  it("returns false for a different release's marker (per-version scoping)", () => {
    const comments: ThreadComment[] = [
      { author: githubActionsBot, body: releaseMarker('v1.2.3-beta.4') }
    ]
    expect(hasReleaseComment(comments, marker)).toBe(false)
  })

  it('returns false when the marker is present but the author is not the bot (anti-spoof)', () => {
    const comments: ThreadComment[] = [{ author: 'eve', body: marker }]
    expect(hasReleaseComment(comments, marker)).toBe(false)
  })
})

type Recorded = { op: 'getThread' | 'comment' | 'addLabel'; number: number }

// A fake TargetWriter records every call and can be programmed to reject a
// specific (number, op) with an HTTP-ish status — letting the loop's failure
// handling be exercised at the port boundary, with no octokit or network. Each
// verb takes the whole `Target`; the fake keys everything off its number, since
// the loop's behaviour is identical across kinds (the real adapter is what
// dispatches transport). The thread read returns whatever the target is seeded
// with.
function makeFakeWriter(
  opts: {
    existingLabels?: Record<number, string[]>
    existingComments?: Record<number, ThreadComment[]>
    failOn?: Record<
      number,
      { op: Recorded['op']; status?: number; graphqlType?: string }
    >
  } = {}
) {
  const calls: Recorded[] = []
  // Spies that capture the *payload* the loop writes (body, label), which the
  // ordering `calls` list deliberately drops. They let a test assert the version
  // and channel actually rendered into the comment and the label.
  const commentSpy = vi.fn<(issueNumber: number, body: string) => void>()
  const addLabelSpy = vi.fn<(issueNumber: number, label: string) => void>()
  function maybeThrow(number: number, op: Recorded['op']) {
    const failure = opts.failOn?.[number]
    if (!failure || failure.op !== op) return
    // getThread is GraphQL: field errors arrive HTTP 200 with no numeric status,
    // carrying an `errors` array (NOT_FOUND for a deleted/transferred target,
    // FORBIDDEN for a token-scope problem), the GraphqlResponseError shape.
    // The REST verbs (comment/addLabel) reject with a real RequestError.
    if (failure.graphqlType !== undefined) {
      throw Object.assign(
        new Error(`simulated GraphQL ${failure.graphqlType}`),
        {
          errors: [{ type: failure.graphqlType }]
        }
      )
    }
    if (failure.status !== undefined) {
      throw new RequestError(`simulated ${failure.status}`, failure.status, {
        request: { method: 'POST', url: '/', headers: {} }
      })
    }
  }
  const writer: TargetWriter = {
    async getThread({ number }) {
      calls.push({ op: 'getThread', number })
      maybeThrow(number, 'getThread')
      return {
        labels: opts.existingLabels?.[number] ?? [],
        comments: opts.existingComments?.[number] ?? []
      }
    },
    async comment({ number }, body) {
      calls.push({ op: 'comment', number })
      commentSpy(number, body)
      maybeThrow(number, 'comment')
    },
    async addLabel({ number }, label) {
      calls.push({ op: 'addLabel', number })
      addLabelSpy(number, label)
      maybeThrow(number, 'addLabel')
    }
  }
  return { writer, calls, commentSpy, addLabelSpy }
}

const gaInfo = resolveChannelInfo('v1.2.3') // label "released"
const twoTargets: Target[] = [
  { number: 1, kind: 'PR' },
  { number: 2, kind: 'issue' }
]

// A target carrying this bot's marker for `tag` (i.e. already commented).
function finalized(tag: string): ThreadComment[] {
  return [{ author: githubActionsBot, body: `done\n${releaseMarker(tag)}\n` }]
}

describe('commentAndLabel', () => {
  it('comments then labels every fresh target, in target order', async () => {
    const { writer, calls } = makeFakeWriter()
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: twoTargets
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'addLabel', number: 1 },
      { op: 'getThread', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })

  it('writes a GA PR the stable channel + version and the released label', async () => {
    const { writer, commentSpy, addLabelSpy } = makeFakeWriter()
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    // The rendered body carries the kind noun, the stable 🚀 channel, and the GA
    // version; the label is the stable channel label.
    expect(commentSpy).toHaveBeenCalledExactlyOnceWith(
      1,
      expect.stringMatching(/🚀 This PR is included in nuqs@1\.2\.3\b/)
    )
    expect(addLabelSpy).toHaveBeenCalledExactlyOnceWith(1, 'released')
  })

  it('writes a beta issue the beta channel + version and the @beta label', async () => {
    const { writer, commentSpy, addLabelSpy } = makeFakeWriter()
    await commentAndLabel({
      writer,
      tag: 'v1.2.3-beta.2',
      info: resolveChannelInfo('v1.2.3-beta.2'),
      targets: [{ number: 100, kind: 'issue' }]
    })
    expect(commentSpy).toHaveBeenCalledExactlyOnceWith(
      100,
      expect.stringMatching(
        /🧪 This issue is resolved in nuqs@1\.2\.3-beta\.2\b/
      )
    )
    expect(addLabelSpy).toHaveBeenCalledExactlyOnceWith(
      100,
      'released on @beta'
    )
  })

  it('comments and labels a discussion target with the discussion noun', async () => {
    // A discussion rides the same loop as an issue/PR — only the comment noun and
    // (in the real adapter) the transport differ. The node id is carried but never
    // touched by the kind-agnostic loop.
    const { writer, calls, commentSpy, addLabelSpy } = makeFakeWriter()
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ kind: 'discussion', number: 7, id: 'D_kwDO' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 7 },
      { op: 'comment', number: 7 },
      { op: 'addLabel', number: 7 }
    ])
    expect(commentSpy).toHaveBeenCalledExactlyOnceWith(
      7,
      expect.stringMatching(/🚀 This discussion is addressed in nuqs@1\.2\.3\b/)
    )
    expect(addLabelSpy).toHaveBeenCalledExactlyOnceWith(7, 'released')
  })

  it('skips a target with both marker and label already present', async () => {
    const { writer, calls } = makeFakeWriter({
      existingComments: { 1: finalized('v1.2.3') },
      existingLabels: { 1: ['released'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: twoTargets
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'getThread', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })

  it('adds only the missing label when the comment already exists', async () => {
    const { writer, calls } = makeFakeWriter({
      existingComments: { 1: finalized('v1.2.3') }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'addLabel', number: 1 }
    ])
  })

  it('re-posts only the comment when the label already exists', async () => {
    const { writer, calls } = makeFakeWriter({
      existingLabels: { 1: ['released'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'comment', number: 1 }
    ])
  })

  it('still comments a beta-finalized target during a GA finalize', async () => {
    // The PR rode betas: it carries the beta marker + `released on @beta`. The GA
    // finalize finds neither its own marker nor `released`, so it does both.
    const { writer, calls } = makeFakeWriter({
      existingComments: { 1: finalized('v1.2.3-beta.4') },
      existingLabels: { 1: ['released on @beta'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'addLabel', number: 1 }
    ])
  })

  it('comments the new beta on a reopened-then-refixed issue, without re-adding its existing @beta label', async () => {
    // #100 shipped a failed fix in beta.1 (so it carries the beta.1 marker comment
    // and `released on @beta`), was reopened, and is genuinely refixed in beta.2.
    // The beta.2 finalize must post a fresh comment — the older beta.1 marker does
    // not suppress it (per-version scoping) — but the label is already present, so
    // it is not re-added.
    const { writer, calls } = makeFakeWriter({
      existingComments: { 100: finalized('v1.2.3-beta.1') },
      existingLabels: { 100: ['released on @beta'] }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3-beta.2',
      info: resolveChannelInfo('v1.2.3-beta.2'),
      targets: [{ number: 100, kind: 'issue' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 100 },
      { op: 'comment', number: 100 }
    ])
  })

  it('still comments when a non-bot comment carries the marker (anti-spoof)', async () => {
    const { writer, calls } = makeFakeWriter({
      existingComments: {
        1: [{ author: 'eve', body: releaseMarker('v1.2.3') }]
      }
    })
    await commentAndLabel({
      writer,
      tag: 'v1.2.3',
      info: gaInfo,
      targets: [{ number: 1, kind: 'PR' }]
    })
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'addLabel', number: 1 }
    ])
  })

  it('skips a NOT_FOUND thread read (deleted/transferred target) without failing, and processes the rest', async () => {
    const { writer, calls } = makeFakeWriter({
      failOn: { 1: { op: 'getThread', graphqlType: 'NOT_FOUND' } }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: twoTargets
      })
    ).resolves.toBeUndefined()
    // #1 bailed at getThread; #2 fully processed (never aborts mid-loop).
    expect(calls).toEqual([
      { op: 'getThread', number: 1 },
      { op: 'getThread', number: 2 },
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

  it('fails loud when a label write fails after a successful comment (target proven writable, not deleted)', async () => {
    // Edge case: the comment landed, so #1 is reachable and writable:
    // a 404/403 on the follow-up label is a real fault (e.g. a missing label),
    // not a deleted target. It must fail the job (→ red, re-run applies the label)
    // rather than leave #1 silently commented-but-unlabelled on a green run.
    const { writer, commentSpy, addLabelSpy } = makeFakeWriter({
      failOn: { 1: { op: 'addLabel', status: 404 } }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: [{ number: 1, kind: 'PR' }]
      })
    ).rejects.toThrow(/re-run/)
    expect(commentSpy).toHaveBeenCalledOnce()
    expect(addLabelSpy).toHaveBeenCalledOnce()
  })

  it('skips a FORBIDDEN thread read on a single target without failing', async () => {
    const { writer } = makeFakeWriter({
      failOn: { 1: { op: 'getThread', graphqlType: 'FORBIDDEN' } }
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

  it('fails when every one of multiple targets is unrecoverable (misconfiguration, not a green no-op)', async () => {
    // A wrong token/repo 404s every target. A lone deletion stays green, but a
    // whole release all-404/403 must not look like a successful finalize.
    const { writer } = makeFakeWriter({
      failOn: {
        1: { op: 'getThread', graphqlType: 'NOT_FOUND' },
        2: { op: 'getThread', graphqlType: 'NOT_FOUND' }
      }
    })
    await expect(
      commentAndLabel({
        writer,
        tag: 'v1.2.3',
        info: gaInfo,
        targets: twoTargets
      })
    ).rejects.toThrow(/misconfiguration/)
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
      { op: 'getThread', number: 1 },
      { op: 'comment', number: 1 },
      { op: 'getThread', number: 2 },
      { op: 'comment', number: 2 },
      { op: 'addLabel', number: 2 }
    ])
  })
})
