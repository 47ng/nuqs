'use client'

import { CommitGraph, type Commit } from '@/src/components/commit-graph'
import { ArrowDown } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react'

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

// Staged-publishing diagram ---------------------------------------------------

// Approve/package-live in green, reject/dropped in red, plumbing in muted grey.
const staged = {
  approve: '#22c55e', // green-500
  reject: '#f87171', // red-400
  plumbing: '#a1a1aa' // zinc-400
}

type Side = 'top' | 'right' | 'bottom' | 'left'

type Connector = {
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

const stagedConnectors: Connector[] = [
  {
    from: 'publish',
    fromSide: 'right',
    to: 'box',
    toSide: 'left',
    color: staged.plumbing
  },
  {
    from: 'download',
    fromSide: 'bottom',
    to: 'inspect',
    toSide: 'top',
    color: staged.plumbing
  },
  {
    from: 'approve',
    fromSide: 'right',
    to: 'live',
    toSide: 'left',
    color: staged.approve
  },
  {
    from: 'reject',
    fromSide: 'right',
    to: 'dropped',
    toSide: 'left',
    color: staged.reject
  }
]

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

function StagedAction({
  color,
  anchor,
  children
}: {
  color: string
  anchor: string
  children: ReactNode
}) {
  return (
    <span
      data-anchor={anchor}
      className="rounded-xl border-2 px-5 py-1.5 text-center text-sm font-semibold"
      style={{ color, borderColor: color, backgroundColor: `${color}14` }}
    >
      {children}
    </span>
  )
}

export function StagingArea() {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <figure className="not-prose border-border/60 bg-card my-8 overflow-x-auto rounded-xl border shadow-sm">
      <div ref={ref} className="relative min-w-[44rem] px-8 pt-14 pb-10">
        <figcaption className="text-foreground absolute inset-x-0 top-5 text-center text-base font-medium">
          Staging Area
        </figcaption>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-10">
          <code
            data-anchor="publish"
            className="text-muted-foreground font-mono text-xs"
          >
            npm stage publish
          </code>

          <div
            data-anchor="box"
            className="border-muted-foreground/40 rounded-2xl border-2 border-dashed px-6 py-5"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-foreground font-mono text-lg font-semibold">
                  nuqs@1.2.3
                </span>
                <code
                  data-anchor="download"
                  className="text-muted-foreground font-mono text-xs"
                >
                  {'npm stage download <uid>'}
                </code>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5">
                <StagedAction color={staged.approve} anchor="approve">
                  Approve
                </StagedAction>
                <StagedAction color={staged.reject} anchor="reject">
                  Reject
                </StagedAction>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7 text-sm font-medium">
            <span
              data-anchor="live"
              className="leading-tight"
              style={{ color: staged.approve }}
            >
              Package live
              <br />
              on npm
            </span>
            <span data-anchor="dropped" style={{ color: staged.reject }}>
              Tarball dropped
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-10 pt-10">
          <div />
          <code
            data-anchor="inspect"
            className="text-muted-foreground ml-6 w-fit font-mono text-xs"
          >
            Inspect tarball
          </code>
          <div />
        </div>

        <DiagramConnectors containerRef={ref} connectors={stagedConnectors} />
      </div>
    </figure>
  )
}

// Release-pipeline diagrams ---------------------------------------------------

// Badge colours flag the elevated permission each phase needs, so the
// id-token/contents split the article describes is visible at a glance.
const permission = {
  idToken: '#22c55e', // green-500 — OIDC trusted publishing
  contents: '#f59e0b', // amber-500 — write the draft release
  scopes: '#8b5cf6' // violet-500 — finalize's comment/label reach
}

type Trait = { label: string; color: string }

type PipelineStep = {
  id: string
  detail: string
  trait?: Trait
}

function PermissionBadge({ label, color }: Trait) {
  return (
    <code
      className="shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium"
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}14`
      }}
    >
      {label}
    </code>
  )
}

function WorkflowNode({ step, mono }: { step: PipelineStep; mono?: boolean }) {
  return (
    <div className="border-border/70 bg-muted/30 flex items-center justify-between gap-4 rounded-lg border px-4 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={`text-foreground text-sm font-medium ${mono ? 'font-mono' : ''}`}
        >
          {step.id}
        </span>
        <span className="text-muted-foreground/70 text-xs">{step.detail}</span>
      </div>
      {step.trait && <PermissionBadge {...step.trait} />}
    </div>
  )
}

function FlowArrow() {
  return (
    <ArrowDown
      aria-hidden
      className="text-muted-foreground/50 mx-auto my-1.5 size-4 shrink-0"
    />
  )
}

function Pipeline({ steps, mono }: { steps: PipelineStep[]; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <Fragment key={step.id}>
          {i > 0 && <FlowArrow />}
          <WorkflowNode step={step} mono={mono} />
        </Fragment>
      ))}
    </div>
  )
}

function TriggerChip({ children }: { children: ReactNode }) {
  return (
    <code className="border-border/70 bg-muted/40 text-muted-foreground self-center rounded-full border px-3 py-1 font-mono text-xs">
      {children}
    </code>
  )
}

// One job per box, in `needs` order — the chain is fully sequential.
const draftJobs: PipelineStep[] = [
  { id: 'compute-version', detail: 'walk the commit tree → next semver' },
  {
    id: 'generate-notes',
    detail: 'render the changelog from the commit graph'
  },
  { id: 'ci', detail: 'full test suite (reusable ci-cd.yml)' },
  {
    id: 'stage',
    detail: 'npm stage publish, with provenance',
    trait: { label: 'id-token: write', color: permission.idToken }
  },
  {
    id: 'create-draft',
    detail: 'open the draft GitHub release',
    trait: { label: 'contents: write', color: permission.contents }
  }
]

// A single least-privilege job; these are its meaningful steps.
const finalizeSteps: PipelineStep[] = [
  {
    id: 'Verify live on npm',
    detail: 'registry curl — bails if the 2FA approval was skipped'
  },
  {
    id: 'Comment + label issues & PRs',
    detail: 'derived from the commit graph, idempotent on re-runs'
  },
  {
    id: 'Bust docs ISR caches',
    detail: 'contributors + changelog, stable releases only'
  },
  {
    id: 'Notify on Slack',
    detail: 'always — release card or failure notice'
  }
]

export function ReleaseDraftJobs() {
  return (
    <figure className="not-prose border-border/60 bg-card my-8 rounded-xl border p-6 shadow-sm">
      <div className="mx-auto flex max-w-md flex-col">
        <TriggerChip>workflow_dispatch</TriggerChip>
        <FlowArrow />
        <Pipeline steps={draftJobs} mono />
      </div>
    </figure>
  )
}

export function ReleaseFinalizeJobs() {
  return (
    <figure className="not-prose border-border/60 bg-card my-8 rounded-xl border p-6 shadow-sm">
      <div className="mx-auto flex max-w-md flex-col">
        <TriggerChip>release: published</TriggerChip>
        <FlowArrow />
        <div className="border-muted-foreground/40 rounded-2xl border-2 border-dashed p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <code className="text-foreground font-mono text-sm font-semibold">
              finalize
            </code>
            <PermissionBadge
              label="issues / PRs / discussions: write"
              color={permission.scopes}
            />
          </div>
          <Pipeline steps={finalizeSteps} />
        </div>
      </div>
    </figure>
  )
}
