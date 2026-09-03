import { execFileSync } from 'node:child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readAllTags, readReleaseHistory, tagExists } from './git'

vi.mock('node:child_process')

const execFileSyncMock = vi.mocked(execFileSync)

beforeEach(() => {
  execFileSyncMock.mockReset()
})

describe('readAllTags', () => {
  it('only reads version tags merged into origin/next', () => {
    execFileSyncMock.mockReturnValue('v1.2.3\nv1.2.4-beta.1\n')

    expect(readAllTags()).toEqual(['v1.2.3', 'v1.2.4-beta.1'])
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      ['tag', '--list', 'v*', '--merged', 'origin/next'],
      { encoding: 'utf8' }
    )
  })
})

describe('readReleaseHistory', () => {
  it('reads one commit graph with tags attached to their commits', () => {
    execFileSyncMock.mockReturnValue(
      [
        'c3',
        'c2',
        'feat: a feature',
        '',
        'c2',
        'c1',
        'fix: a bug',
        'tag: refs/tags/v1.2.4, tag: refs/tags/v1.2.4-beta.1',
        'c1',
        '',
        'chore: initial',
        'tag: refs/tags/v1.2.3',
        ''
      ].join('\x00')
    )

    expect(readReleaseHistory()).toEqual([
      {
        hash: 'c3',
        parents: ['c2'],
        message: 'feat: a feature',
        tags: []
      },
      {
        hash: 'c2',
        parents: ['c1'],
        message: 'fix: a bug',
        tags: ['v1.2.4', 'v1.2.4-beta.1']
      },
      {
        hash: 'c1',
        parents: [],
        message: 'chore: initial',
        tags: ['v1.2.3']
      }
    ])
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      [
        'log',
        '-z',
        'HEAD',
        '--decorate=full',
        '--decorate-refs=refs/tags/v*',
        '--format=%H%x00%P%x00%B%x00%D'
      ],
      { encoding: 'utf8' }
    )
  })

  it('rejects malformed git log output', () => {
    execFileSyncMock.mockReturnValue('hash\x00parent\x00message')
    expect(() => readReleaseHistory()).toThrow(
      'Unexpected git log record shape'
    )
  })
})

describe('tagExists', () => {
  it('checks every local tag, including tags outside next', () => {
    execFileSyncMock.mockReturnValue('v1.2.4-beta.1\n')
    expect(tagExists('v1.2.4-beta.1')).toBe(true)
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      ['tag', '--list', 'v1.2.4-beta.1'],
      { encoding: 'utf8' }
    )
  })
})
