'use client'

/* eslint-disable @next/next/no-img-element */

/**
 * jalco-ui
 * CommitGraph
 * by Justin Levine
 * ui.justinlevine.me
 * https://ui.justinlevine.me/docs/components/commit-graph
 *
 * Topological git graph with rail lines showing branch forks, merges,
 * and commit ancestry. Renders the same visual as GUI git clients
 * like GitKraken, Fork, or Tower.
 *
 * Props:
 * - commits: array of commits with parent hashes for topology
 * - truncateHash?: number of hash characters to show (default 7)
 * - railWidth?: pixel width per rail column (default 24)
 *
 * Dependencies: radix-ui (Popover)
 */

import { cn } from '@/src/lib/utils'
import { Popover } from 'radix-ui'
import * as React from 'react'

interface CommitAuthor {
  name: string
  avatarUrl?: string
}

interface Commit {
  /** Commit hash (full or abbreviated). */
  hash: string
  /** Commit message (first line). */
  message: string
  /** Commit author. */
  author: CommitAuthor
  /** ISO date string or Date object. */
  date: string | Date
  /** Parent commit hashes. Empty for root commits. Two parents = merge commit. */
  parents: string[]
  /** Branch or ref label (e.g. "main", "feat/auth"). */
  refs?: string[]
  /** Tag label (e.g. "v1.0.0"). */
  tag?: string
}

interface CommitGraphProps
  extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Commits in topological order (newest first). Each commit includes parent hashes. */
  commits: Commit[]
  /** Number of hash characters to display. @default 7 */
  truncateHash?: number
  /** Pixel width per rail column. @default 24 */
  railWidth?: number
  /** Rail index → rail/dot color (6-digit hex). Unlisted rails fall back to the built-in palette. */
  railColors?: Record<number, string>
  /** Branch/ref name → badge color (6-digit hex). Unlisted refs fall back to the rail color. */
  refColors?: Record<string, string>
  /** Tag name → badge color (6-digit hex). Unlisted tags fall back to the rail color. */
  tagColors?: Record<string, string>
}

const RAIL_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316'
]

function color(rail: number): string {
  return RAIL_COLORS[rail % RAIL_COLORS.length]
}

// Graph layout computation

interface GraphRow {
  commit: Commit
  rail: number
  rails: (string | null)[] // hash occupying each rail at this row
  edges: Edge[]
}

interface Edge {
  fromRail: number
  toRail: number
  color: string
  type: 'straight' | 'merge-in' | 'fork-out'
}

function computeLayout(commits: Commit[]): GraphRow[] {
  const rows: GraphRow[] = []
  // Active rails: each slot holds the hash of the commit it's "waiting for"
  const rails: (string | null)[] = []

  for (const commit of commits) {
    const hash = commit.hash

    // Find which rail this commit occupies (if any rail is waiting for it)
    let commitRail = rails.indexOf(hash)

    if (commitRail === -1) {
      // New branch — find first empty slot or append
      const emptySlot = rails.indexOf(null)
      if (emptySlot !== -1) {
        commitRail = emptySlot
        rails[commitRail] = hash
      } else {
        commitRail = rails.length
        rails.push(hash)
      }
    }

    const commitColor = color(commitRail)
    const edges: Edge[] = []

    // Draw straight lines for all other active rails (pass-through)
    for (let r = 0; r < rails.length; r++) {
      if (r !== commitRail && rails[r] !== null) {
        edges.push({
          fromRail: r,
          toRail: r,
          color: color(r),
          type: 'straight'
        })
      }
    }

    // Clear this rail — the commit has been rendered
    rails[commitRail] = null

    // Process parents
    const parents = commit.parents
    if (parents.length >= 1) {
      const firstParent = parents[0]
      // First parent continues on the same rail
      const existingRail = rails.indexOf(firstParent)
      if (existingRail !== -1) {
        // Parent already expected on another rail — merge line
        edges.push({
          fromRail: commitRail,
          toRail: existingRail,
          color: commitColor,
          type: 'merge-in'
        })
      } else {
        // Parent takes this commit's rail
        rails[commitRail] = firstParent
        edges.push({
          fromRail: commitRail,
          toRail: commitRail,
          color: commitColor,
          type: 'straight'
        })
      }
    }

    // Second+ parents (merge sources)
    for (let p = 1; p < parents.length; p++) {
      const parentHash = parents[p]
      const existingRail = rails.indexOf(parentHash)
      if (existingRail !== -1) {
        // Already on a rail — draw merge line from that rail
        edges.push({
          fromRail: existingRail,
          toRail: commitRail,
          color: color(existingRail),
          type: 'merge-in'
        })
      } else {
        // Needs a new rail — fork out
        const emptySlot = rails.indexOf(null)
        const newRail = emptySlot !== -1 ? emptySlot : rails.length
        if (newRail >= rails.length) rails.push(null)
        rails[newRail] = parentHash
        edges.push({
          fromRail: commitRail,
          toRail: newRail,
          color: color(newRail),
          type: 'fork-out'
        })
      }
    }

    // Trim trailing nulls
    while (rails.length > 0 && rails[rails.length - 1] === null) {
      rails.pop()
    }

    rows.push({
      commit,
      rail: commitRail,
      rails: [...rails],
      edges
    })
  }

  return rows
}

// SVG rendering for rails

const ROW_HEIGHT = 40

function RailsSVG({
  row,
  prevRow,
  railWidth,
  maxRails,
  resolveColor
}: {
  row: GraphRow
  prevRow: GraphRow | null
  railWidth: number
  maxRails: number
  resolveColor: (rail: number) => string
}) {
  const w = maxRails * railWidth
  const h = ROW_HEIGHT
  const cy = h / 2

  function rx(rail: number) {
    return rail * railWidth + railWidth / 2
  }

  const commitX = rx(row.rail)

  // Collect which rails are active above this row (from previous row's post-state)
  const activeAbove = new Set<number>()
  if (prevRow) {
    for (let r = 0; r < prevRow.rails.length; r++) {
      if (prevRow.rails[r] !== null) activeAbove.add(r)
    }
  }

  // Collect which rails are active below this row
  const activeBelow = new Set<number>()
  for (let r = 0; r < row.rails.length; r++) {
    if (row.rails[r] !== null) activeBelow.add(r)
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Pass-through rails: any rail active both above and below that isn't the commit rail */}
      {Array.from(activeAbove).map(r => {
        if (r === row.rail) return null
        if (!activeBelow.has(r)) return null
        const x = rx(r)
        return (
          <line
            key={`pt-${r}`}
            x1={x}
            y1={0}
            x2={x}
            y2={h}
            stroke={resolveColor(r)}
            strokeWidth={2}
            strokeOpacity={0.6}
          />
        )
      })}

      {/* Commit rail: incoming line (top to dot) */}
      {activeAbove.has(row.rail) && (
        <line
          x1={commitX}
          y1={0}
          x2={commitX}
          y2={cy}
          stroke={resolveColor(row.rail)}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      )}

      {/* Commit rail: outgoing line (dot to bottom) */}
      {activeBelow.has(row.rail) && (
        <line
          x1={commitX}
          y1={cy}
          x2={commitX}
          y2={h}
          stroke={resolveColor(row.rail)}
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      )}

      {/* Fork-out curves: commit rail to a new rail below */}
      {row.edges
        .filter(e => e.type === 'fork-out')
        .map((edge, i) => (
          <path
            key={`f-${i}`}
            d={`M${rx(edge.fromRail)},${cy} C${rx(edge.fromRail)},${h} ${rx(edge.toRail)},${cy} ${rx(edge.toRail)},${h}`}
            stroke={edge.color}
            strokeWidth={2}
            strokeOpacity={0.6}
            fill="none"
          />
        ))}

      {/* Merge curves */}
      {row.edges
        .filter(e => e.type === 'merge-in')
        .map((edge, i) => {
          const isOutgoing = edge.fromRail === row.rail
          const x1 = rx(edge.fromRail)
          const x2 = rx(edge.toRail)
          // Outgoing: this commit's parent is on another rail — curve from dot down to target
          // Incoming: another rail merges into this commit — curve from top of source rail to dot
          const d = isOutgoing
            ? `M${x1},${cy} C${x1},${h} ${x2},${cy} ${x2},${h}`
            : `M${x1},${0} C${x1},${cy} ${x2},${0} ${x2},${cy}`
          return (
            <path
              key={`m-${i}`}
              d={d}
              stroke={edge.color}
              strokeWidth={2}
              strokeOpacity={0.6}
              fill="none"
            />
          )
        })}

      {/* Rails that were active above but terminate here (not the commit rail, not continuing) */}
      {Array.from(activeAbove).map(r => {
        if (r === row.rail) return null
        if (activeBelow.has(r)) return null
        // This rail ends — draw line from top to center height then stop
        const x = rx(r)
        return (
          <line
            key={`end-${r}`}
            x1={x}
            y1={0}
            x2={x}
            y2={cy}
            stroke={resolveColor(r)}
            strokeWidth={2}
            strokeOpacity={0.6}
          />
        )
      })}

      {/* Rails that start here (not the commit rail, not active above) */}
      {Array.from(activeBelow).map(r => {
        if (r === row.rail) return null
        if (activeAbove.has(r)) return null
        // Already drawn by fork-out curves, skip standalone lines
        return null
      })}

      {/* Commit dot (drawn last, on top) */}
      <circle
        cx={commitX}
        cy={cy}
        r={5}
        fill={resolveColor(row.rail)}
        stroke="var(--color-background)"
        strokeWidth={2}
      />
    </svg>
  )
}

// Commit popover

function CommitDetail({
  commit,
  hashLength,
  refBadgeColor,
  tagBadgeColor,
  children
}: {
  commit: Commit
  hashLength: number
  refBadgeColor: (ref: string) => string
  tagBadgeColor: (tag: string) => string
  children: React.ReactNode
}) {
  // Anchor above the commit's right edge: the graph reaches the container edge
  // at every breakpoint, so a side popover would clip off-screen.
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="border-border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border p-3 shadow-md"
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-snug font-medium">{commit.message}</p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5">
                {commit.author.avatarUrl ? (
                  <img
                    src={commit.author.avatarUrl}
                    alt=""
                    width={14}
                    height={14}
                    className="border-border/60 bg-muted size-3.5 rounded-full border"
                  />
                ) : (
                  <span className="bg-muted flex size-3.5 items-center justify-center rounded-full text-[7px] font-bold">
                    {commit.author.name
                      .split(/\s+/)
                      .map(w => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                )}
                {commit.author.name}
              </span>
              <span className="text-border">·</span>
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]">
                {commit.hash.slice(0, hashLength)}
              </code>
            </div>
            <div className="text-muted-foreground text-[11px]">
              {formatFullDate(commit.date)}
            </div>
            {(commit.refs || commit.tag) && (
              <div className="flex flex-wrap gap-1">
                {commit.refs?.map(ref => (
                  <span
                    key={ref}
                    className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      borderColor: `${refBadgeColor(ref)}40`,
                      backgroundColor: `${refBadgeColor(ref)}10`,
                      color: refBadgeColor(ref)
                    }}
                  >
                    {ref}
                  </span>
                ))}
                {commit.tag && (
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${tagBadgeColor(commit.tag)}20`,
                      color: tagBadgeColor(commit.tag)
                    }}
                  >
                    {commit.tag}
                  </span>
                )}
              </div>
            )}
            {commit.parents.length > 0 && (
              <div className="text-muted-foreground/60 text-[10px]">
                {commit.parents.length === 1 ? 'Parent' : 'Parents'}:{' '}
                {commit.parents.map(p => p.slice(0, hashLength)).join(', ')}
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function formatFullDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Main component

function CommitGraph({
  commits,
  truncateHash = 7,
  railWidth = 24,
  railColors,
  refColors,
  tagColors,
  className,
  ...props
}: CommitGraphProps) {
  const resolveColor = (rail: number) => railColors?.[rail] ?? color(rail)
  const resolveRefColor = (rail: number, ref: string) =>
    refColors?.[ref] ?? resolveColor(rail)
  const resolveTagColor = (rail: number, tag: string) =>
    tagColors?.[tag] ?? resolveColor(rail)

  // Simple mode: if no commit has parents, infer a linear topology
  const hasTopology = commits.some(c => c.parents && c.parents.length > 0)
  const resolvedCommits = hasTopology
    ? commits
    : commits.map((c, i) => ({
        ...c,
        parents: i < commits.length - 1 ? [commits[i + 1].hash] : []
      }))

  if (resolvedCommits.length === 0) {
    return (
      <div
        data-slot="commit-graph"
        className={cn(
          'border-border/60 bg-card text-muted-foreground flex items-center justify-center rounded-xl border py-10 text-sm shadow-sm',
          className
        )}
        {...props}
      >
        No commits.
      </div>
    )
  }

  const rows = computeLayout(resolvedCommits)
  const maxRails = Math.max(
    ...rows.map(r =>
      Math.max(
        r.rail + 1,
        r.rails.length,
        ...r.edges.map(e => Math.max(e.fromRail, e.toRail) + 1)
      )
    )
  )
  const svgWidth = maxRails * railWidth

  return (
    <div
      data-slot="commit-graph"
      className={cn(
        'border-border/60 bg-card overflow-hidden rounded-xl border shadow-sm',
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        {rows.map((row, i) => (
          <CommitDetail
            key={`${row.commit.hash}-${i}`}
            commit={row.commit}
            hashLength={truncateHash}
            refBadgeColor={ref => resolveRefColor(row.rail, ref)}
            tagBadgeColor={tag => resolveTagColor(row.rail, tag)}
          >
            <button
              type="button"
              data-slot="commit-entry"
              className="border-border/30 hover:bg-muted/30 focus-visible:bg-muted/30 flex w-full items-center gap-0 border-b transition-colors last:border-b-0 focus-visible:outline-none"
              style={{ height: ROW_HEIGHT }}
            >
              {/* Rails */}
              <div style={{ width: svgWidth }} className="shrink-0">
                <RailsSVG
                  row={row}
                  prevRow={i > 0 ? rows[i - 1] : null}
                  railWidth={railWidth}
                  maxRails={maxRails}
                  resolveColor={resolveColor}
                />
              </div>

              {/* Message + refs */}
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                <p className="text-foreground/80 min-w-0 truncate text-left text-sm">
                  {row.commit.message}
                </p>
                {(row.commit.refs?.length || row.commit.tag) && (
                  <div className="flex shrink-0 items-center gap-1">
                    {row.commit.refs?.map(ref => (
                      <span
                        key={ref}
                        data-ref={ref}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-none font-semibold"
                        style={{
                          borderColor: `${resolveRefColor(row.rail, ref)}40`,
                          backgroundColor: `${resolveRefColor(row.rail, ref)}10`,
                          color: resolveRefColor(row.rail, ref)
                        }}
                      >
                        {ref}
                      </span>
                    ))}
                    {row.commit.tag && (
                      <span
                        data-tag={row.commit.tag}
                        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] leading-none font-semibold"
                        style={{
                          backgroundColor: `${resolveTagColor(row.rail, row.commit.tag)}20`,
                          color: resolveTagColor(row.rail, row.commit.tag)
                        }}
                      >
                        {row.commit.tag}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex shrink-0 items-center gap-3 px-3">
                <code className="text-muted-foreground/60 font-mono text-[11px]">
                  {row.commit.hash.slice(0, truncateHash)}
                </code>
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  {row.commit.author.avatarUrl ? (
                    <img
                      src={row.commit.author.avatarUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="border-border/60 bg-muted size-4 rounded-full border"
                    />
                  ) : (
                    <span className="bg-muted text-muted-foreground flex size-4 items-center justify-center rounded-full text-[8px] font-bold">
                      {row.commit.author.name
                        .split(/\s+/)
                        .map(w => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                  <span className="hidden sm:inline">
                    {row.commit.author.name}
                  </span>
                </span>
                <span className="text-muted-foreground/50 text-[11px]">
                  {formatDate(row.commit.date)}
                </span>
              </div>
            </button>
          </CommitDetail>
        ))}
      </div>
    </div>
  )
}

export { CommitGraph, type Commit, type CommitAuthor, type CommitGraphProps }
