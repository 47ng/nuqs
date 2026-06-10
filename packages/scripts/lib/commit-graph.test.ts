import { describe, expect, it, vi } from 'vitest'
import {
  collectContributors,
  collectIssues,
  discoverRelease,
  extractPRNumber,
  isBot,
  resolveChannel,
  resolveRange,
  type PR,
  type ReleaseGraphReader
} from './commit-graph'

describe('resolveChannel', () => {
  it('maps a GA tag to the stable channel', () => {
    expect(resolveChannel('v1.3.0')).toBe('stable')
    expect(resolveChannel('v2.0.0')).toBe('stable')
  })

  it('maps a prerelease tag to the beta channel', () => {
    expect(resolveChannel('v1.3.0-beta.1')).toBe('beta')
    expect(resolveChannel('v2.0.0-beta.42')).toBe('beta')
  })
})

describe('resolveRange', () => {
  it('beta is incremental: checkpoint is the immediately-preceding tag', () => {
    // A second beta for the same target announces only its own new commits.
    const range = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.2',
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.2']
    })
    expect(range).toEqual({ from: 'v1.3.0-beta.1', to: 'v1.3.0-beta.2' })
  })

  it('GA is cumulative: checkpoint is the previous GA, skipping betas', () => {
    // The stable release re-announces everyone since the last GA, including
    // contributors who only ever rode the intervening betas.
    const range = resolveRange({
      channel: 'stable',
      currentRef: 'v1.3.0',
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.2', 'v1.3.0']
    })
    expect(range).toEqual({ from: 'v1.2.3', to: 'v1.3.0' })
  })

  it('folds a recomputed-higher beta target onto the nearest preceding tag', () => {
    // A feat landed after a patch-beta (v1.2.4-beta.1), recomputing the target
    // up to the minor v1.3.0; the new beta still checkpoints on the nearest
    // preceding published tag, bridging the gap.
    const range = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.1',
      tags: ['v1.2.3', 'v1.2.4-beta.1', 'v1.3.0-beta.1']
    })
    expect(range).toEqual({ from: 'v1.2.4-beta.1', to: 'v1.3.0-beta.1' })
  })

  it('self-heals across a rejected beta that left no tag', () => {
    // beta.2 was staged then rejected, so no v1.3.0-beta.2 tag exists. beta.3
    // checkpoints on beta.1 and thereby folds in beta.2's orphaned commits.
    const range = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.3',
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.3']
    })
    expect(range).toEqual({ from: 'v1.3.0-beta.1', to: 'v1.3.0-beta.3' })
  })

  it('walks from the beginning for the first-ever release', () => {
    expect(
      resolveRange({
        channel: 'stable',
        currentRef: 'v0.1.0',
        tags: ['v0.1.0']
      })
    ).toEqual({ from: null, to: 'v0.1.0' })
    expect(
      resolveRange({ channel: 'beta', currentRef: 'HEAD', tags: [] })
    ).toEqual({ from: null, to: 'HEAD' })
  })

  it('resolves the draft phase from HEAD against the greatest published tag', () => {
    // beta draft: checkpoint is the nearest existing tag of any channel.
    expect(
      resolveRange({
        channel: 'beta',
        currentRef: 'HEAD',
        tags: ['v1.2.3', 'v1.3.0-beta.1']
      })
    ).toEqual({ from: 'v1.3.0-beta.1', to: 'HEAD' })
    // GA draft: checkpoint is the last GA, ignoring a higher beta.
    expect(
      resolveRange({
        channel: 'stable',
        currentRef: 'HEAD',
        tags: ['v1.2.3', 'v1.3.0-beta.1']
      })
    ).toEqual({ from: 'v1.2.3', to: 'HEAD' })
  })

  it('first GA over only betas walks from history start (betas are not GA checkpoints)', () => {
    // No prior GA exists; the intervening betas don't count as a stable
    // checkpoint, so the cumulative GA re-announces from the beginning.
    expect(
      resolveRange({
        channel: 'stable',
        currentRef: 'v1.0.0',
        tags: ['v1.0.0-beta.1', 'v1.0.0-beta.2', 'v1.0.0']
      })
    ).toEqual({ from: null, to: 'v1.0.0' })
  })

  it('ignores non-semver tags in the list', () => {
    // semver.valid guards the candidate set: junk refs never become a checkpoint.
    expect(
      resolveRange({
        channel: 'beta',
        currentRef: 'v1.3.0-beta.2',
        tags: ['latest', 'v1.2', 'nightly', 'v1.3.0-beta.1', 'v1.3.0-beta.2']
      })
    ).toEqual({ from: 'v1.3.0-beta.1', to: 'v1.3.0-beta.2' })
  })

  it('agrees between the draft (HEAD) and finalize (published tag) phases', () => {
    // The published tag sits on the drafted HEAD, so both phases resolve the
    // identical checkpoint — drafted notes and finalize comments always agree.
    const tagsBeforePublish = ['v1.2.3', 'v1.2.4-beta.1']
    const draft = resolveRange({
      channel: 'beta',
      currentRef: 'HEAD',
      tags: tagsBeforePublish
    })
    const finalize = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.1',
      tags: [...tagsBeforePublish, 'v1.3.0-beta.1']
    })
    expect(finalize.from).toBe(draft.from)
    expect(draft.from).toBe('v1.2.4-beta.1')
  })
})

describe('extractPRNumber', () => {
  it('extracts the (#N) suffix from a squash-merge subject', () => {
    expect(extractPRNumber('feat: add a thing (#123)')).toBe(123)
  })

  it('returns null for a subject without a (#N)', () => {
    expect(extractPRNumber('chore: a direct push with no PR')).toBeNull()
  })

  it('takes the last (#N) when several appear in the subject', () => {
    expect(extractPRNumber('fix: reconcile (#1) and (#2) (#456)')).toBe(456)
  })
})

describe('isBot', () => {
  it('flags [bot]-suffixed and known bot accounts (case-insensitive)', () => {
    expect(isBot('renovate[bot]')).toBe(true)
    expect(isBot('Dependabot')).toBe(true)
    expect(isBot('GitHub-Actions')).toBe(true)
  })

  it('does not flag human accounts', () => {
    expect(isBot('alice')).toBe(false)
    expect(isBot('franky47')).toBe(false)
  })
})

// Helper to create a minimal PR object for testing.
function createPR(
  overrides: Partial<PR> & { number: number; title: string }
): PR {
  return {
    author: null,
    participants: { nodes: [] },
    closingIssuesReferences: { edges: [] },
    ...overrides
  }
}

describe('collectContributors', () => {
  it('returns empty array when no PRs', () => {
    expect(collectContributors([])).toEqual([])
  })

  it('excludes franky47 from contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'test: should ignore @franky47',
        participants: { nodes: [{ login: 'franky47' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual([])
  })

  it('excludes bot accounts from contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'chore: update deps',
        participants: { nodes: [{ login: 'dependabot[bot]' }] }
      }),
      createPR({
        number: 2,
        title: 'chore: ci',
        participants: { nodes: [{ login: 'github-actions[bot]' }] }
      }),
      createPR({
        number: 3,
        title: 'chore: renovate',
        participants: { nodes: [{ login: 'renovate[bot]' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual([])
  })

  it('collects external contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        participants: { nodes: [{ login: 'contributor1' }] }
      }),
      createPR({
        number: 2,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'contributor2' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual(['contributor1', 'contributor2'])
  })

  it('deduplicates contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        participants: { nodes: [{ login: 'contributor1' }] }
      }),
      createPR({
        number: 2,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'contributor1' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual(['contributor1'])
  })

  it('includes issue participants as contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'franky47' }] },
        closingIssuesReferences: {
          edges: [
            {
              node: {
                number: 100,
                participants: { nodes: [{ login: 'issueReporter' }] }
              }
            }
          ]
        }
      })
    ]
    expect(collectContributors(prs)).toEqual(['issueReporter'])
  })

  it('includes PR discussion participants as contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        author: { login: 'prAuthor' },
        participants: {
          nodes: [
            { login: 'prAuthor' },
            { login: 'commenter1' },
            { login: 'commenter2' }
          ]
        }
      })
    ]
    expect(collectContributors(prs)).toEqual([
      'commenter1',
      'commenter2',
      'prAuthor'
    ])
  })

  it('deduplicates across PR author, PR participants, and issue participants', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'fix: bug',
        author: { login: 'contributor1' },
        participants: {
          nodes: [{ login: 'contributor1' }, { login: 'contributor2' }]
        },
        closingIssuesReferences: {
          edges: [
            {
              node: {
                number: 100,
                participants: {
                  nodes: [{ login: 'contributor2' }, { login: 'contributor3' }]
                }
              }
            }
          ]
        }
      })
    ]
    expect(collectContributors(prs)).toEqual([
      'contributor1',
      'contributor2',
      'contributor3'
    ])
  })

  it('sorts contributors alphabetically (case insensitive)', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        participants: { nodes: [{ login: 'Zara' }] }
      }),
      createPR({
        number: 2,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'alice' }] }
      }),
      createPR({
        number: 3,
        title: 'doc: readme',
        participants: { nodes: [{ login: 'Bob' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual(['alice', 'Bob', 'Zara'])
  })
})

describe('collectIssues', () => {
  it('returns empty when no PRs and when PRs close nothing', () => {
    expect(collectIssues([])).toEqual([])
    expect(collectIssues([createPR({ number: 1, title: 'chore: x' })])).toEqual(
      []
    )
  })

  it('collects each PR’s closing issues', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'fix: bug',
        closingIssuesReferences: {
          edges: [
            { node: { number: 10, participants: { nodes: [] } } },
            { node: { number: 11, participants: { nodes: [] } } }
          ]
        }
      })
    ]
    expect(collectIssues(prs)).toEqual([{ number: 10 }, { number: 11 }])
  })

  it('deduplicates an issue closed by more than one PR', () => {
    const closes100 = {
      edges: [{ node: { number: 100, participants: { nodes: [] } } }]
    }
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'fix: a',
        closingIssuesReferences: closes100
      }),
      createPR({
        number: 2,
        title: 'fix: b',
        closingIssuesReferences: closes100
      })
    ]
    expect(collectIssues(prs)).toEqual([{ number: 100 }])
  })
})

describe('discoverRelease', () => {
  it('returns an empty release without fetching when no commit references a PR', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.0.0'],
      readCommitSubjects: () => ['chore: direct push', 'docs: fix typo'],
      fetchPullRequests: () => {
        throw new Error(
          'fetchPullRequests should not be called for an empty range'
        )
      }
    }
    await expect(
      discoverRelease({ channel: 'stable', currentRef: 'HEAD', reader })
    ).resolves.toEqual({ changes: [], issues: [], contributors: [] })
  })

  it('projects changes (type from the commit, description from the title) and derives issues and contributors', async () => {
    const pr1 = createPR({
      number: 1,
      title: 'feat: first',
      participants: { nodes: [{ login: 'alice' }] },
      closingIssuesReferences: {
        edges: [
          {
            node: { number: 100, participants: { nodes: [{ login: 'bob' }] } }
          }
        ]
      }
    })
    const pr2 = createPR({
      number: 2,
      title: 'fix: second',
      participants: { nodes: [{ login: 'renovate[bot]' }] }
    })
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      readCommitSubjects: () => [
        'feat: first (#1)',
        'chore: direct push',
        'fix: second (#2)',
        'docs: same PR again (#1)'
      ],
      fetchPullRequests: vi.fn(async () => [pr1, pr2])
    }
    await expect(
      discoverRelease({ channel: 'beta', currentRef: 'HEAD', reader })
    ).resolves.toEqual({
      changes: [
        {
          prNumber: 1,
          type: 'feat',
          description: 'first',
          author: null,
          closingIssues: [{ number: 100 }]
        },
        {
          prNumber: 2,
          type: 'fix',
          description: 'second',
          author: null,
          closingIssues: []
        }
      ],
      issues: [{ number: 100 }],
      contributors: ['alice', 'bob']
    })
    expect(reader.fetchPullRequests).toHaveBeenCalledExactlyOnceWith([1, 2])
  })

  it('resolves the channel-asymmetric range before reading commit subjects', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0'],
      readCommitSubjects: vi.fn(() => []),
      fetchPullRequests: async () => []
    }
    // GA finalize: cumulative since the previous GA, skipping the beta.
    await discoverRelease({ channel: 'stable', currentRef: 'v1.3.0', reader })
    expect(reader.readCommitSubjects).toHaveBeenCalledExactlyOnceWith({
      from: 'v1.2.3',
      to: 'v1.3.0'
    })
  })
})

// An in-memory ReleaseGraphReader over a single linear history (oldest first),
// so readTags, readCommitSubjects and fetchPullRequests stay mutually
// consistent — letting scenario tests query the same history the two ways the
// release phases do. A commit's optional `tag` marks the tag pointing at it;
// readCommitSubjects mirrors `git log from..to`: the (from, to] slice, with
// `to: 'HEAD'` reaching the end of history.
function makeHistoryReader(history: {
  commits: Array<{ subject: string; tag?: string }>
  prs: PR[]
}): ReleaseGraphReader {
  const { commits, prs } = history
  const indexOfTag = (tag: string) =>
    commits.findIndex(commit => commit.tag === tag)
  return {
    readTags: () => commits.flatMap(({ tag }) => (tag ? [tag] : [])),
    readCommitSubjects: range => {
      const from = range.from ? indexOfTag(range.from) : -1
      const to = range.to === 'HEAD' ? commits.length - 1 : indexOfTag(range.to)
      return commits.slice(from + 1, to + 1).map(({ subject }) => subject)
    },
    fetchPullRequests: async numbers =>
      prs.filter(pr => numbers.includes(pr.number))
  }
}

describe('discoverRelease (history scenarios)', () => {
  it('drafts (HEAD) and finalizes (published tag) the same release', async () => {
    // The module's core promise: the drafted notes list exactly what finalize
    // comments on. Draft runs on HEAD with the channel from the environment;
    // finalize runs on the just-published tag (now in the tag list) with the
    // channel re-derived from it.
    const prs = [
      createPR({
        number: 2,
        title: 'feat: new thing',
        participants: { nodes: [{ login: 'alice' }] }
      }),
      createPR({
        number: 3,
        title: 'fix: regression',
        closingIssuesReferences: {
          edges: [
            {
              node: { number: 100, participants: { nodes: [{ login: 'bob' }] } }
            }
          ]
        }
      })
    ]
    const commitsBeforePublish = [
      { subject: 'feat: previous (#1)', tag: 'v1.2.3' },
      { subject: 'feat: new thing (#2)' },
      { subject: 'fix: regression (#3)' }
    ]
    const tag = 'v1.3.0-beta.1'
    const draft = await discoverRelease({
      channel: 'beta',
      currentRef: 'HEAD',
      reader: makeHistoryReader({ commits: commitsBeforePublish, prs })
    })
    const finalize = await discoverRelease({
      channel: resolveChannel(tag),
      currentRef: tag,
      reader: makeHistoryReader({
        commits: [
          // Tag is now published on the last commit (amend history for finalize)
          ...commitsBeforePublish.slice(0, -1),
          { subject: 'fix: regression (#3)', tag }
        ],
        prs
      })
    })
    expect(finalize).toEqual(draft)
    expect(draft.changes.map(c => c.prNumber)).toEqual([2, 3])
    expect(draft.issues).toEqual([{ number: 100 }])
    expect(draft.contributors).toEqual(['alice', 'bob'])
  })

  it('GA re-announces the PRs and contributors each beta only saw as a delta', async () => {
    // Beta contributors get thanked again at GA: each beta announces only its own
    // commits, but the cumulative GA walks from the previous GA and so
    // re-includes every beta's PRs and beta-only contributors.
    const history = {
      commits: [
        { subject: 'fix: base (#1)', tag: 'v1.2.3' },
        { subject: 'feat: beta feature (#2)', tag: 'v1.3.0-beta.1' },
        { subject: 'fix: beta fix (#3)', tag: 'v1.3.0-beta.2' },
        { subject: 'docs: final touch (#4)', tag: 'v1.3.0' }
      ],
      prs: [
        createPR({
          number: 2,
          title: 'feat: beta feature',
          participants: { nodes: [{ login: 'alice' }] }
        }),
        createPR({
          number: 3,
          title: 'fix: beta fix',
          participants: { nodes: [{ login: 'bob' }] }
        }),
        createPR({ number: 4, title: 'docs: final touch' })
      ]
    }
    const reader = makeHistoryReader(history)
    const beta2 = await discoverRelease({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.2',
      reader
    })
    expect(beta2.changes.map(c => c.prNumber)).toEqual([3])
    expect(beta2.contributors).toEqual(['bob'])

    const ga = await discoverRelease({
      channel: 'stable',
      currentRef: 'v1.3.0',
      reader
    })
    expect(ga.changes.map(c => c.prNumber)).toEqual([2, 3, 4])
    expect(ga.contributors).toEqual(['alice', 'bob'])
  })

  it('tolerates a commit referencing a PR the reader cannot resolve', async () => {
    // A `(#N)` can point at nothing (e.g. a transferred issue): the reader
    // returns a subset of the requested numbers, and the release is derived
    // from the survivors alone — no crash, no phantom entries.
    const release = await discoverRelease({
      channel: 'beta',
      currentRef: 'HEAD',
      reader: makeHistoryReader({
        commits: [
          { subject: 'fix: base (#1)', tag: 'v1.2.3' },
          { subject: 'feat: real (#2)' },
          { subject: 'chore: vanished (#999)' }
        ],
        prs: [
          createPR({
            number: 2,
            title: 'feat: real',
            participants: { nodes: [{ login: 'alice' }] }
          })
        ]
      })
    })
    expect(release).toEqual({
      changes: [expect.objectContaining({ prNumber: 2, type: 'feat' })],
      issues: [],
      contributors: ['alice']
    })
  })
})
