'use client'

import { CommitGraph, type Commit } from '@/src/components/commit-graph'
import { ArrowDown } from 'lucide-react'

const author = { name: 'François Best' }

// next is the neutral trunk, master the release branch, tags mark releases.
const colors = {
  master: '#22c55e', // green-500
  tag: '#f59e0b' // amber-500
}

const refColor = (ref: string) => (ref === 'master' ? colors.master : undefined)
const tagColor = () => colors.tag

const history: Commit[] = [
  {
    hash: 'a1b2c3d',
    message: 'feat: global defaults for all parsers',
    author,
    date: '2026-06-24T16:20:00Z',
    parents: ['e4f5a6b']
  },
  {
    hash: 'e4f5a6b',
    message: 'fix: clear empty arrays from the URL',
    author,
    date: '2026-06-23T11:05:00Z',
    parents: ['7c8d9e0']
  },
  {
    hash: '7c8d9e0',
    message: 'chore: bump dependencies',
    author,
    date: '2026-06-20T09:40:00Z',
    parents: ['f1a2b3c']
  },
  {
    hash: 'f1a2b3c',
    message: 'doc: refresh the migration guide',
    author,
    date: '2026-02-14T18:00:00Z',
    parents: []
  }
]

function withRefs(refsByHash: Record<string, Pick<Commit, 'refs' | 'tag'>>) {
  return history.map(commit => ({ ...commit, ...refsByHash[commit.hash] }))
}

// `master` is pinned at the last release, several commits behind `next`.
const before = withRefs({
  a1b2c3d: { refs: ['next'] },
  f1a2b3c: { refs: ['master'], tag: 'v2.8.0' }
})

// Fast-forwarding `master` up to `next` cuts the new release.
const after = withRefs({
  a1b2c3d: { refs: ['next', 'master'], tag: 'v2.9.0' },
  f1a2b3c: { tag: 'v2.8.0' }
})

export function AdvanceMasterToNext() {
  return (
    <figure className="not-prose my-8 flex flex-col items-stretch gap-3">
      <div className="flex flex-col gap-2">
        <figcaption className="text-muted-foreground text-sm">
          <code>master</code> trails <code>next</code>
        </figcaption>
        <CommitGraph commits={before} refColor={refColor} tagColor={tagColor} />
      </div>
      <ArrowDown
        aria-label="fast-forward then tag a release"
        className="text-muted-foreground mx-auto size-5 shrink-0"
      />
      <div className="flex flex-col gap-2">
        <figcaption className="text-muted-foreground text-sm">
          fast-forwarded, then tagged by <code>semantic-release</code>
        </figcaption>
        <CommitGraph commits={after} refColor={refColor} tagColor={tagColor} />
      </div>
    </figure>
  )
}
