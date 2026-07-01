'use client'

// The interactive holes for the article's diagrams: everything that needs a
// browser (DOM measurement via refs + ResizeObserver) or has to hand a function
// prop to the client-only CommitGraph. The agnostic shells live in the sibling
// `.components.tsx` and slot server-rendered markup into these via children
// (donut pattern), so only these leaves ship to the browser.

import { CommitGraph, type Commit } from '@/src/components/commit-graph'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react'

// --- Commit-graph figure -----------------------------------------------------

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

// `master` several commits behind `next`, before the fast-forward.
export function BeforeCommitGraph() {
  return (
    <CommitGraph commits={before} refColor={refColor} tagColor={tagColor} />
  )
}

// `master` fast-forwarded onto `next`, with the release arrow overlaid.
export function FastForwardGraph() {
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

// --- Measured connector overlay ----------------------------------------------

type Side = 'top' | 'right' | 'bottom' | 'left'

export type Connector = {
  from: string
  fromSide: Side
  to: string
  toSide: Side
  color: string
}

const NORMAL: Record<Side, [number, number]> = {
  top: [0, -1],
  right: [1, 0],
  bottom: [0, 1],
  left: [-1, 0]
}

function sideAnchor(rect: DOMRect, side: Side): [number, number] {
  switch (side) {
    case 'top':
      return [rect.left + rect.width / 2, rect.top]
    case 'bottom':
      return [rect.left + rect.width / 2, rect.bottom]
    case 'left':
      return [rect.left, rect.top + rect.height / 2]
    case 'right':
      return [rect.right, rect.top + rect.height / 2]
  }
}

const markerId = (color: string) => `staged-arrow-${color.replace('#', '')}`

// Curved connectors drawn between rendered anchors — measured from the DOM so
// they stay aligned across breakpoints and font loads (same approach as
// ReleaseArrow above).
function DiagramConnectors({
  containerRef,
  connectors
}: {
  containerRef: RefObject<HTMLDivElement | null>
  connectors: Connector[]
}) {
  const [paths, setPaths] = useState<{ d: string; color: string }[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const compute = () => {
      const c = container.getBoundingClientRect()
      const next = connectors.flatMap(conn => {
        const fromEl = container.querySelector(`[data-anchor="${conn.from}"]`)
        const toEl = container.querySelector(`[data-anchor="${conn.to}"]`)
        if (
          !(fromEl instanceof HTMLElement) ||
          !(toEl instanceof HTMLElement)
        ) {
          return []
        }
        const [fnx, fny] = NORMAL[conn.fromSide]
        const [tnx, tny] = NORMAL[conn.toSide]
        const [fx, fy] = sideAnchor(
          fromEl.getBoundingClientRect(),
          conn.fromSide
        )
        const [tx, ty] = sideAnchor(toEl.getBoundingClientRect(), conn.toSide)
        const sx = fx - c.left + fnx * 2
        const sy = fy - c.top + fny * 2
        const ex = tx - c.left + tnx * 8
        const ey = ty - c.top + tny * 8
        const k = Math.min(Math.max(Math.hypot(ex - sx, ey - sy) * 0.4, 24), 90)
        return [
          {
            d: `M${sx},${sy} C${sx + fnx * k},${sy + fny * k} ${ex + tnx * k},${ey + tny * k} ${ex},${ey}`,
            color: conn.color
          }
        ]
      })
      setPaths(next)
      setSize({ w: container.offsetWidth, h: container.offsetHeight })
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(container)
    void document.fonts?.ready.then(compute)
    return () => observer.disconnect()
  }, [containerRef, connectors])

  if (size.w === 0) return null
  const colors = Array.from(new Set(paths.map(p => p.color)))
  return (
    <svg
      aria-hidden
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      <defs>
        {colors.map(color => (
          <marker
            key={color}
            id={markerId(color)}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path
              d="M1,1 L5,3 L1,5"
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>
      {paths.map((p, i) => (
        <path
          key={`conn-${i}`}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={2}
          strokeLinecap="round"
          markerEnd={`url(#${markerId(p.color)})`}
        />
      ))}
    </svg>
  )
}

// Donut hole: owns the measured container ref, renders the server-rendered
// diagram markup (children) verbatim, and overlays the connector SVG on top.
export function MeasuredDiagram({
  connectors,
  className,
  children
}: {
  connectors: Connector[]
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className={className}>
      {children}
      <DiagramConnectors containerRef={ref} connectors={connectors} />
    </div>
  )
}
