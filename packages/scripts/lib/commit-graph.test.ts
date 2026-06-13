import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { z } from 'zod'
import {
  type Change,
  collectContributors,
  collectIssues,
  type CommitRecord,
  discoverChanges,
  discoverTargets,
  extractPRNumber,
  fetchPRNodes,
  isBot,
  type PR,
  readCommits,
  type ReleaseGraphReader,
  resolveChannel,
  resolveRange
} from './commit-graph'

// Build CommitRecord[] from raw messages, with placeholder SHA/author (PR-
// sourced tests don't read them). For direct-commit assertions, construct
// records inline with explicit SHA/author.
function records(...messages: string[]): CommitRecord[] {
  return messages.map(message => ({
    sha: '0000000000',
    author: 'Jane Doe',
    message
  }))
}

// The PR numbers of the PR-sourced changes, in order (commit-sourced changes
// have no number).
function prNumbersOf(changes: Change[]): number[] {
  return changes.flatMap(c => (c.source === 'squashedPR' ? [c.prNumber] : []))
}

describe('resolveChannel', () => {
  it('maps a GA tag to the stable channel', () => {
    expect(resolveChannel('v1.3.0')).toBe('stable')
    expect(resolveChannel('v2.0.0')).toBe('stable')
  })

  it('maps a prerelease tag to the beta channel', () => {
    expect(resolveChannel('v1.3.0-beta.1')).toBe('beta')
    expect(resolveChannel('v2.0.0-beta.42')).toBe('beta')
  })

  // Not sure which of throwing or propagating null is better,
  // but we need to be robust against suffixes that
  // don't fall in either stable or beta.
  it('should reject other suffixes', () => {
    expect(() => resolveChannel('v1.3.0-alpha.1')).toThrow()
    expect(() => resolveChannel('0.0.0-preview.12345')).toThrow()
  })
})

describe('resolveRange', () => {
  it('beta is incremental: `from` is the immediately-preceding tag', () => {
    const range = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.2',
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.2']
    })
    expect(range).toEqual({ from: 'v1.3.0-beta.1', to: 'v1.3.0-beta.2' })
  })

  it('GA is cumulative: `from` is the previous GA, skipping betas', () => {
    // The stable release re-announces everyone since the last GA, including
    // contributors who only ever rode the intervening betas.
    const range = resolveRange({
      channel: 'stable',
      currentRef: 'v1.3.0',
      tags: ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0-beta.2', 'v1.3.0']
    })
    expect(range).toEqual({ from: 'v1.2.3', to: 'v1.3.0' })
  })

  it('resolves `from` as the nearest preceding tag, even across beta target bumps', () => {
    // A feat landed after a patch-beta (v1.2.4-beta.1), bumping the target
    // up to the minor v1.3.0; the new beta still resolves `from` as the nearest
    // preceding published tag.
    const range = resolveRange({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.1',
      tags: ['v1.2.3', 'v1.2.4-beta.1', 'v1.3.0-beta.1']
    })
    expect(range).toEqual({ from: 'v1.2.4-beta.1', to: 'v1.3.0-beta.1' })
  })

  it('handles a missing beta tag', () => {
    // Edge case, but it should be able to handle gaps in tag sequences
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

  it('resolves a HEAD currentRef against the nearest appropriate tag (draft stage)', () => {
    // beta draft: `from` is the nearest existing tag of any channel.
    expect(
      resolveRange({
        channel: 'beta',
        currentRef: 'HEAD',
        tags: ['v1.2.3', 'v1.3.0-beta.1']
      })
    ).toEqual({ from: 'v1.3.0-beta.1', to: 'HEAD' })
    // GA draft: `from` is the last GA, ignoring a higher beta.
    expect(
      resolveRange({
        channel: 'stable',
        currentRef: 'HEAD',
        tags: ['v1.2.3', 'v1.3.0-beta.1']
      })
    ).toEqual({ from: 'v1.2.3', to: 'HEAD' })
  })

  it('resolves first GA over beta-only as history start', () => {
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

  it('ignores a non-parens #N suffix', () => {
    expect(extractPRNumber('feat: add a thing from #123')).toBeNull()
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
        title: 'test: we thank external contributors, not the author.',
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
        participants: { nodes: [{ login: 'alice' }] }
      }),
      createPR({
        number: 2,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'bob' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual(['alice', 'bob'])
  })

  it('deduplicates contributors', () => {
    const prs: PR[] = [
      createPR({
        number: 1,
        title: 'feat: test',
        participants: { nodes: [{ login: 'alice' }] }
      }),
      createPR({
        number: 2,
        title: 'fix: bug',
        participants: { nodes: [{ login: 'alice' }] }
      })
    ]
    expect(collectContributors(prs)).toEqual(['alice'])
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

  it("collects each PR's closing issues", () => {
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

describe('discoverChanges', () => {
  it('returns nothing without fetching when the range is empty', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.0.0'],
      readCommits: () => [],
      fetchChangeDetails: () => {
        throw new Error('fetchChangeDetails should not be called for no PRs')
      },
      fetchClosingIssues: () => {
        throw new Error('discoverChanges must not take the finalize path')
      }
    }
    await expect(
      discoverChanges({ channel: 'stable', currentRef: 'HEAD', reader })
    ).resolves.toEqual({ changes: [], contributors: [] })
  })

  it('builds direct-commit changes (SHA, subject, author) without fetching when no commit references a PR', async () => {
    // git log is newest-first; the notes list direct commits oldest-first, so the
    // older `chore` precedes the newer `fix`. SHA is truncated to 8 chars.
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.0.0'],
      readCommits: () => [
        {
          sha: 'ffff1111aa',
          author: 'Alice Dev',
          message: 'fix: hot patch'
        },
        { sha: 'eeee2222bb', author: 'Bob Ops', message: 'chore: tidy up' }
      ],
      fetchChangeDetails: () => {
        throw new Error('no PRs to fetch')
      },
      fetchClosingIssues: () => {
        throw new Error('discoverChanges must not take the finalize path')
      }
    }
    await expect(
      discoverChanges({ channel: 'stable', currentRef: 'HEAD', reader })
    ).resolves.toEqual({
      changes: [
        {
          source: 'directCommit',
          sha: 'eeee2222',
          type: 'chore',
          breaking: false,
          description: 'tidy up',
          author: 'Bob Ops'
        },
        {
          source: 'directCommit',
          sha: 'ffff1111',
          type: 'fix',
          breaking: false,
          description: 'hot patch',
          author: 'Alice Dev'
        }
      ],
      // External contributors can't direct-commit,
      // and are attributed as part of their release note line.
      contributors: []
    })
  })

  it('projects PR changes (type from the commit, description from the title) and derives contributors', async () => {
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
      readCommits: () =>
        records('feat: first (#1)', 'fix: second (#2)', 'docs: same PR (#1)'),
      fetchChangeDetails: vi.fn(async () => [pr1, pr2]),
      fetchClosingIssues: vi.fn(async () => [])
    }
    await expect(
      discoverChanges({ channel: 'beta', currentRef: 'HEAD', reader })
    ).resolves.toEqual({
      changes: [
        {
          source: 'squashedPR',
          prNumber: 1,
          type: 'feat',
          breaking: false,
          description: 'first',
          author: null,
          closingIssues: [{ number: 100 }]
        },
        {
          source: 'squashedPR',
          prNumber: 2,
          type: 'fix',
          breaking: false,
          description: 'second',
          author: null,
          closingIssues: []
        }
      ],
      contributors: ['alice', 'bob']
    })
    // Notes fetches the change details only; the finalize fetch is untouched.
    expect(reader.fetchChangeDetails).toHaveBeenCalledExactlyOnceWith([1, 2])
    expect(reader.fetchClosingIssues).not.toHaveBeenCalled()
  })

  it('keeps the first-seen classification and warns when a PR number recurs with a divergent type', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      // PR #1's squash commit classifies it `feat`; a later commit re-uses the
      // (#1) suffix with a divergent `fix`. First-seen wins; the conflict warns.
      readCommits: () => records('feat: kept (#1)', 'fix: divergent (#1)'),
      fetchChangeDetails: vi.fn(async () => [
        createPR({ number: 1, title: 'feat: kept' })
      ]),
      fetchClosingIssues: vi.fn(async () => [])
    }
    try {
      const { changes } = await discoverChanges({
        channel: 'stable',
        currentRef: 'HEAD',
        reader
      })
      expect(changes).toEqual([
        {
          source: 'squashedPR',
          prNumber: 1,
          type: 'feat', // first-seen, not the later `fix`
          breaking: false,
          description: 'kept',
          author: null,
          closingIssues: []
        }
      ])
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('#1')
      )
    } finally {
      // Restore even if an assertion throws, so the suppressing spy never
      // leaks into later tests (the config does not auto-restore mocks).
      warn.mockRestore()
    }
  })

  it('lists PR changes first (by number) then direct-commit changes (oldest-first)', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      readCommits: () => [
        // newest-first, as git log emits
        { sha: 'cccc3333', author: 'Dev', message: 'chore: newer direct' },
        { sha: 'bbbb2222', author: 'Dev', message: 'feat: a PR (#7)' },
        { sha: 'aaaa1111', author: 'Dev', message: 'fix: older direct' }
      ],
      fetchChangeDetails: async () => [
        createPR({ number: 7, title: 'feat: a PR' })
      ],
      fetchClosingIssues: async () => []
    }
    const { changes } = await discoverChanges({
      channel: 'beta',
      currentRef: 'HEAD',
      reader
    })
    // PR #7 leads; then the two direct commits oldest-first (fix before chore).
    expect(
      changes.map(c => (c.source === 'squashedPR' ? `#${c.prNumber}` : c.sha))
    ).toEqual(['#7', 'aaaa1111', 'cccc3333'])
  })

  it('takes the type from the squash commit even when the PR title was reworded to a different type (#417)', async () => {
    // The squash commit is `fix:`; the PR was later renamed to `test:`. Category
    // must follow the immutable commit (fix → Bug fixes), and the description is
    // the renamed title as prose. If projection ever read the title's type, this
    // change would land in Other changes — this is the regression lock.
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      readCommits: () => records('fix: real regression fix (#417)'),
      fetchChangeDetails: async () => [
        createPR({ number: 417, title: 'test: flaky thing' })
      ],
      fetchClosingIssues: async () => {
        throw new Error('notes path must not fetch closing issues')
      }
    }
    await expect(
      discoverChanges({ channel: 'beta', currentRef: 'HEAD', reader })
    ).resolves.toEqual({
      changes: [
        {
          source: 'squashedPR',
          prNumber: 417,
          type: 'fix',
          breaking: false,
          description: 'flaky thing',
          author: null,
          closingIssues: []
        }
      ],
      contributors: []
    })
  })

  it('flags a change breaking from the squash subject "!" marker', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      readCommits: () => records('feat!: breaking (#1)', 'feat: normal (#2)'),
      fetchChangeDetails: async () => [
        createPR({ number: 1, title: 'feat!: breaking' }),
        createPR({ number: 2, title: 'feat: normal' })
      ],
      fetchClosingIssues: async () => []
    }
    const { changes } = await discoverChanges({
      channel: 'beta',
      currentRef: 'HEAD',
      reader
    })
    expect(changes.map(c => c.breaking)).toEqual([true, false])
    expect(prNumbersOf(changes)).toEqual([1, 2])
  })

  it('resolves the channel-asymmetric range before reading commit subjects', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.2.3', 'v1.3.0-beta.1', 'v1.3.0'],
      readCommits: vi.fn(() => []),
      fetchChangeDetails: async () => [],
      fetchClosingIssues: async () => []
    }
    // GA finalize: cumulative since the previous GA, skipping the beta.
    await discoverChanges({ channel: 'stable', currentRef: 'v1.3.0', reader })
    expect(reader.readCommits).toHaveBeenCalledExactlyOnceWith({
      from: 'v1.2.3',
      to: 'v1.3.0'
    })
  })
})

describe('discoverTargets', () => {
  it('returns empty targets without fetching when no commit references a PR (direct commits are excluded)', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => ['v1.0.0'],
      readCommits: () => records('chore: direct push', 'docs: fix typo'),
      fetchChangeDetails: () => {
        throw new Error('discoverTargets must not take the notes path')
      },
      fetchClosingIssues: () => {
        throw new Error(
          'fetchClosingIssues should not be called for an empty range'
        )
      }
    }
    await expect(
      discoverTargets({ channel: 'stable', currentRef: 'HEAD', reader })
    ).resolves.toEqual({ changes: [], issues: [] })
  })

  it('projects each PR into a target and derives its closing issues, never fetching the change details', async () => {
    const reader: ReleaseGraphReader = {
      readTags: () => [],
      readCommits: () =>
        records('feat: first (#1)', 'chore: direct push', 'fix: second (#2)'),
      fetchChangeDetails: vi.fn(async () => []),
      fetchClosingIssues: vi.fn(async () => [
        {
          number: 1,
          closingIssuesReferences: {
            edges: [{ node: { number: 100 } }, { node: { number: 101 } }]
          }
        },
        {
          number: 2,
          closingIssuesReferences: { edges: [{ node: { number: 100 } }] }
        }
      ])
    }
    await expect(
      discoverTargets({ channel: 'beta', currentRef: 'HEAD', reader })
    ).resolves.toEqual({
      changes: [{ prNumber: 1 }, { prNumber: 2 }],
      // #100 is closed by both PRs but listed once.
      issues: [{ number: 100 }, { number: 101 }]
    })
    // Finalize fetches the closing issues only; the change details are untouched.
    expect(reader.fetchClosingIssues).toHaveBeenCalledExactlyOnceWith([1, 2])
    expect(reader.fetchChangeDetails).not.toHaveBeenCalled()
  })
})

// An in-memory ReleaseGraphReader over a single linear history (oldest first),
// so readTags, readCommits and both PR fetchers stay mutually consistent —
// letting scenario tests query the same history the two ways the release phases
// do. A commit's `message` is the full squash message (subject + optional body,
// so a `BREAKING CHANGE:` footer can be exercised); its optional `tag` marks the
// tag pointing at it. readCommits mirrors `git log from..to`: the (from, to]
// slice, with `to: 'HEAD'` reaching the end of history. Both fetchers project
// the same underlying PRs, so the finalize view is the notes view minus the
// fields finalize never reads — mirroring production's two GraphQL queries.
function makeHistoryReader(history: {
  commits: Array<{
    message: string
    tag?: string
    sha?: string
    author?: string
  }>
  prs: PR[]
}): ReleaseGraphReader {
  const { commits, prs } = history
  const indexOfTag = (tag: string) =>
    commits.findIndex(commit => commit.tag === tag)
  const select = (numbers: number[]) =>
    prs.filter(pr => numbers.includes(pr.number))
  return {
    readTags: () => commits.flatMap(({ tag }) => (tag ? [tag] : [])),
    readCommits: range => {
      const from = range.from ? indexOfTag(range.from) : -1
      const to = range.to === 'HEAD' ? commits.length - 1 : indexOfTag(range.to)
      // git log emits newest-first; the history array is oldest-first, so reverse
      // the slice to mirror production ordering.
      return commits
        .slice(from + 1, to + 1)
        .reverse()
        .map(({ message, sha, author }) => ({
          sha: sha ?? '0000000000',
          author: author ?? 'Jane Doe',
          message
        }))
    },
    fetchChangeDetails: async numbers => select(numbers),
    fetchClosingIssues: async numbers =>
      select(numbers).map(pr => ({
        number: pr.number,
        closingIssuesReferences: {
          edges: pr.closingIssuesReferences.edges.map(({ node }) => ({
            node: { number: node.number }
          }))
        }
      }))
  }
}

// The set of issue numbers a notes run would comment on (its PR-sourced changes'
// closing issues, deduplicated), to compare against the finalize path's `issues`.
function issuesOf(changes: Change[]) {
  return collectIssues(
    changes.flatMap(change =>
      change.source === 'squashedPR'
        ? [
            {
              closingIssuesReferences: {
                edges: change.closingIssues.map(node => ({ node }))
              }
            }
          ]
        : []
    )
  )
}

describe('discovery (history scenarios)', () => {
  it('drafts (notes, HEAD) and finalizes (targets, published tag) the same set', async () => {
    // The module's core promise: the drafted notes list exactly what finalize
    // comments on. Notes drafts on HEAD via `fetchChangeDetails`; finalize runs
    // on the just-published tag via `fetchClosingIssues` — yet both resolve the
    // identical PR set and closing issues, only the notes-only fields differ.
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
      { message: 'feat: previous (#1)', tag: 'v1.2.3' },
      { message: 'feat: new thing (#2)' },
      { message: 'fix: regression (#3)' }
    ]
    const tag = 'v1.3.0-beta.1'
    const draft = await discoverChanges({
      channel: 'beta',
      currentRef: 'HEAD',
      reader: makeHistoryReader({ commits: commitsBeforePublish, prs })
    })
    const finalize = await discoverTargets({
      channel: resolveChannel(tag),
      currentRef: tag,
      reader: makeHistoryReader({
        commits: [
          // Tag is now published on the last commit (amend history for finalize)
          ...commitsBeforePublish.slice(0, -1),
          { message: 'fix: regression (#3)', tag }
        ],
        prs
      })
    })
    // Same PRs, same closing issues across the two phase-specific paths.
    expect(finalize.changes).toEqual(
      prNumbersOf(draft.changes).map(prNumber => ({ prNumber }))
    )
    expect(finalize.issues).toEqual(issuesOf(draft.changes))
    expect(prNumbersOf(draft.changes)).toEqual([2, 3])
    expect(finalize.issues).toEqual([{ number: 100 }])
    expect(draft.contributors).toEqual(['alice', 'bob'])
  })

  it('GA re-announces the PRs and contributors each beta only saw as a delta', async () => {
    // Beta contributors get thanked again at GA: each beta announces only its own
    // commits, but the cumulative GA walks from the previous GA and so
    // re-includes every beta's PRs and beta-only contributors.
    const history = {
      commits: [
        { message: 'fix: base (#1)', tag: 'v1.2.3' },
        { message: 'feat: beta feature (#2)', tag: 'v1.3.0-beta.1' },
        { message: 'fix: beta fix (#3)', tag: 'v1.3.0-beta.2' },
        { message: 'docs: final touch (#4)', tag: 'v1.3.0' }
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
    const beta2 = await discoverChanges({
      channel: 'beta',
      currentRef: 'v1.3.0-beta.2',
      reader
    })
    expect(prNumbersOf(beta2.changes)).toEqual([3])
    expect(beta2.contributors).toEqual(['bob'])

    const ga = await discoverChanges({
      channel: 'stable',
      currentRef: 'v1.3.0',
      reader
    })
    expect(prNumbersOf(ga.changes)).toEqual([2, 3, 4])
    expect(ga.contributors).toEqual(['alice', 'bob'])
  })

  it('detects a break flagged only by a BREAKING CHANGE body footer', async () => {
    // The squash subject has no `!`; the break lives in the body footer (the
    // reason the shared core reads full messages, not just subjects).
    const reader = makeHistoryReader({
      commits: [
        { message: 'fix: base (#1)', tag: 'v1.2.3' },
        {
          message:
            'feat: drop the legacy option (#2)\n\n' +
            'BREAKING CHANGE: the legacy option is gone.'
        }
      ],
      prs: [createPR({ number: 2, title: 'feat: drop the legacy option' })]
    })
    const { changes } = await discoverChanges({
      channel: 'beta',
      currentRef: 'HEAD',
      reader
    })
    expect(changes).toEqual([
      expect.objectContaining({ prNumber: 2, breaking: true })
    ])
  })

  it('reads the squash PR number from the first line, not a (#N) in the body', async () => {
    // The squash suffix `(#1)` is on the subject; a `(#999)` in the body (e.g.
    // "reverts #999") must not shadow it, or the change would resolve the wrong
    // PR once the core reads full messages.
    const reader = makeHistoryReader({
      commits: [
        { message: 'fix: base (#1)', tag: 'v1.2.3' },
        { message: 'feat: real (#2)\n\nSupersedes the approach in (#999).' }
      ],
      prs: [createPR({ number: 2, title: 'feat: real' })]
    })
    const { changes } = await discoverChanges({
      channel: 'beta',
      currentRef: 'HEAD',
      reader
    })
    expect(prNumbersOf(changes)).toEqual([2])
  })

  it('tolerates a commit referencing a PR neither path can resolve', async () => {
    // A `(#N)` can point at nothing (e.g. a transferred issue): the reader
    // returns a subset of the requested numbers, and both phases derive their
    // output from the survivors alone — no crash, no phantom entries.
    const reader = makeHistoryReader({
      commits: [
        { message: 'fix: base (#1)', tag: 'v1.2.3' },
        { message: 'feat: real (#2)' },
        { message: 'chore: vanished (#999)' }
      ],
      prs: [
        createPR({
          number: 2,
          title: 'feat: real',
          participants: { nodes: [{ login: 'alice' }] },
          closingIssuesReferences: {
            edges: [{ node: { number: 50, participants: { nodes: [] } } }]
          }
        })
      ]
    })
    expect(
      await discoverChanges({ channel: 'beta', currentRef: 'HEAD', reader })
    ).toEqual({
      changes: [expect.objectContaining({ prNumber: 2, type: 'feat' })],
      contributors: ['alice']
    })
    expect(
      await discoverTargets({ channel: 'beta', currentRef: 'HEAD', reader })
    ).toEqual({
      changes: [{ prNumber: 2 }],
      issues: [{ number: 50 }]
    })
  })
})

// The GraphQL IO shell is otherwise untested by design, but the null-node
// handling is load-bearing for the "no change is silently dropped" guarantee, so
// it is pinned here against a mocked GitHub GraphQL endpoint (msw).
const githubGraphql = 'https://api.github.com/graphql'

describe('fetchPRNodes', () => {
  const nodeSchema = z.object({ number: z.number() })
  const baseArgs = {
    prNumbers: [1, 2],
    githubToken: 'token',
    fnLabel: 'test',
    selection: 'number',
    nodeSchema
  }

  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const replyWith = (body: Record<string, unknown>) =>
    server.use(http.post(githubGraphql, () => HttpResponse.json(body)))

  it('makes no request when there are no PR numbers', async () => {
    let requested = false
    server.use(
      http.post(githubGraphql, () => {
        requested = true
        return HttpResponse.json({ data: { repository: {} } })
      })
    )
    await expect(fetchPRNodes({ ...baseArgs, prNumbers: [] })).resolves.toEqual(
      []
    )
    expect(requested).toBe(false)
  })

  it('throws on a GraphQL error rather than silently dropping the nulled PR', async () => {
    // A null node accompanied by an error is a fetch failure (rate limit,
    // timeout), not a nonexistent PR — dropping it would lose a real change.
    replyWith({
      data: { repository: { pr1: { number: 1 }, pr2: null } },
      errors: [{ message: 'RATE_LIMITED' }]
    })
    await expect(fetchPRNodes(baseArgs)).rejects.toThrow(/RATE_LIMITED/)
  })

  it('drops a genuinely-null PR (no errors) and returns the survivors', async () => {
    replyWith({ data: { repository: { pr1: { number: 1 }, pr2: null } } })
    await expect(fetchPRNodes(baseArgs)).resolves.toEqual([{ number: 1 }])
  })

  it('throws on an unexpected response shape', async () => {
    replyWith({ unexpected: true })
    await expect(fetchPRNodes(baseArgs)).rejects.toThrow(/unexpected GraphQL/)
  })
})

// readCommits is otherwise IO-shell glue (untested by design), but reading the
// author (%an) rather than the committer (%cn) is load-bearing for attribution:
// a web-UI edit commits as `GitHub`, and crediting that instead of the real
// person was the bug this guards against. Pinned against a real one-commit repo
// whose committer differs from its author.
describe('readCommits (real git)', () => {
  it('records the commit author, not the `GitHub` committer of a web-UI edit', () => {
    const dir = mkdtempSync(join(tmpdir(), 'commit-graph-'))
    const run = (...args: string[]) =>
      execFileSync('git', args, {
        cwd: dir,
        env: {
          ...process.env,
          // Ignore the contributor's global/system git config so a personal
          // `commit.gpgsign`, hooks path, or commit template can't make this
          // commit prompt, hang, or fail in an unattended/CI run.
          GIT_CONFIG_GLOBAL: '/dev/null',
          GIT_CONFIG_SYSTEM: '/dev/null',
          GIT_AUTHOR_NAME: 'François Best',
          GIT_AUTHOR_EMAIL: 'github@francoisbest.com',
          // A commit made through the GitHub web UI records `GitHub` as committer.
          GIT_COMMITTER_NAME: 'GitHub',
          GIT_COMMITTER_EMAIL: 'noreply@github.com'
        }
      })
    const cwd = process.cwd()
    try {
      run('init', '-q')
      run('commit', '-q', '--allow-empty', '-m', 'doc: tidy readme')
      // readCommits runs git in process.cwd(), so point it at the temp repo.
      process.chdir(dir)
      expect(readCommits({ from: null, to: 'HEAD' })).toEqual([
        {
          sha: expect.any(String),
          author: 'François Best',
          message: expect.stringContaining('doc: tidy readme')
        }
      ])
    } finally {
      process.chdir(cwd)
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
