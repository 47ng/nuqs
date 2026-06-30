'use client'

import { CommitGraph, type Commit } from '@/src/components/commit-graph'
import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'

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

type ArrowGeometry = { d: string; w: number; h: number }
type ArrowPadding = {
  top?: number // head: + lower (below master), − higher (into master)
  right?: number // head: + right, − left
  bottom?: number // tail: + lower, − higher
  left?: number // tail: + right (into row), − left (toward the tag)
}

// Curved red arrow tracing `master` jumping from the old release tag (v2.8.0)
// up to the fast-forwarded tip — positions measured from the rendered badges so
// it stays aligned across breakpoints and font loads.
function ReleaseArrow({
  containerRef,
  padding,
  curvature = 40
}: {
  containerRef: RefObject<HTMLDivElement | null>
  padding?: ArrowPadding
  curvature?: number
}) {
  const [arrow, setArrow] = useState<ArrowGeometry | null>(null)
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding ?? {}
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const compute = () => {
      const from = container.querySelector('[data-tag="v2.8.0"]')
      const to = container.querySelector('[data-ref="master"]')
      if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement)) {
        setArrow(null)
        return
      }
      const c = container.getBoundingClientRect()
      const f = from.getBoundingClientRect()
      const t = to.getBoundingClientRect()
      const sx = f.right - c.left + left
      const sy = f.top + f.height / 2 - c.top + bottom
      const tx = t.left + t.width / 2 - c.left + right
      const ty = t.bottom - c.top + top
      const cx = Math.max(sx, tx) + curvature
      const cy = (sy + ty) / 2
      setArrow({
        d: `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`,
        w: c.width,
        h: c.height
      })
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    void document.fonts?.ready.then(compute)
    return () => observer.disconnect()
  }, [containerRef, top, right, bottom, left, curvature])

  if (!arrow) return null
  return (
    <svg
      aria-hidden
      width={arrow.w}
      height={arrow.h}
      viewBox={`0 0 ${arrow.w} ${arrow.h}`}
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
    >
      <defs>
        <marker
          id="release-arrowhead"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path
            d="M1,1 L5,3 L1,5"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={arrow.d}
        fill="none"
        stroke="#ef4444"
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd="url(#release-arrowhead)"
      />
    </svg>
  )
}

function FastForwardGraph() {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className="relative">
      <CommitGraph commits={after} refColor={refColor} tagColor={tagColor} />
      <ReleaseArrow
        containerRef={ref}
        curvature={15}
        padding={{
          top: 5,
          left: 20
        }}
      />
    </div>
  )
}

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
        <FastForwardGraph />
      </div>
    </figure>
  )
}
