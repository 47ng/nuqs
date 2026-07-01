import { cn } from '@/src/lib/utils'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Fragment, type ComponentProps, type ReactNode } from 'react'
import {
  BeforeCommitGraph,
  FastForwardGraph,
  MeasuredDiagram,
  type Connector
} from './publishing-for-supply-chain-security.client'

// The agnostic (server-rendered) layer: static diagram markup that ships no
// client JS. The interactive parts — the DOM-measured arrows and the commit
// graph — live in the sibling `.client.tsx` and are slotted in via composition
// (`FastForwardGraph`/`BeforeCommitGraph` as leaves, `MeasuredDiagram` as a
// donut that wraps the server-rendered diagram markup).

export function AdvanceMasterToNext() {
  return (
    <figure className="not-prose my-8 flex flex-col items-stretch gap-3">
      <div className="flex flex-col gap-2">
        <figcaption className="text-muted-foreground text-sm">
          <code>master</code> trails <code>next</code>
        </figcaption>
        <BeforeCommitGraph />
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
  return (
    <figure className="not-prose border-border/60 bg-card my-8 overflow-x-auto rounded-xl border shadow-sm">
      <MeasuredDiagram
        connectors={stagedConnectors}
        className="relative min-w-[44rem] px-8 pt-14 pb-10"
      >
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
      </MeasuredDiagram>
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

// Phase keywords + overview ---------------------------------------------------

// GitHub's status palette mapped to the three phases — in-progress (amber),
// success (green), merged (violet) — darker on light, lighter on dark.
const phaseText = {
  draft: 'text-amber-600 dark:text-amber-400',
  validate: 'text-green-600 dark:text-green-400',
  finalize: 'text-violet-600 dark:text-violet-400'
}

const phaseBorder = {
  draft: 'border-amber-500/40',
  validate: 'border-green-500/40',
  finalize: 'border-violet-500/40'
}

type Phase = keyof typeof phaseText

// Inline keyword colouring, reused for every draft/validate/finalize mention in
// the prose. Colour only — weight inherits, so it reads right in both a heading
// and a sentence.
export function Phase({
  kind,
  children
}: {
  kind: Phase
  children: ReactNode
}) {
  return <span className={phaseText[kind]}>{children}</span>
}

function PhaseCard({
  kind,
  summary,
  footer,
  gate,
  className
}: ComponentProps<'div'> & {
  kind: Phase
  summary: string
  footer: string
  gate?: boolean
}) {
  return (
    <div
      className={cn(
        `bg-muted/30 flex w-48 shrink-0 flex-col gap-2 rounded-xl border p-4 ${phaseBorder[kind]}`,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${phaseText[kind]}`}>
          {kind}
        </span>
        {gate && (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-green-500/60 text-[11px] font-bold text-green-600 dark:text-green-400">
            ?
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{summary}</p>
      <code className="text-muted-foreground/70 mt-auto font-mono text-[11px]">
        {footer}
      </code>
    </div>
  )
}

function OverviewArrow() {
  return (
    <ArrowRight
      aria-hidden
      className="text-muted-foreground/50 size-5 shrink-0 self-center"
    />
  )
}

export function PublishingOverview() {
  return (
    <figure className="not-prose border-border/60 bg-card my-8 overflow-x-auto rounded-xl border p-6 shadow-sm">
      <div className="flex min-w-[42rem] items-stretch justify-center gap-3">
        <PhaseCard
          kind="draft"
          summary="Compute the version, stage to npm with provenance, open a draft GitHub release."
          footer="workflow_dispatch"
        />
        <OverviewArrow />
        <PhaseCard
          gate
          kind="validate"
          summary="Reproduce the build, match the integrity hash, then approve the staged package with 2FA — or reject it."
          footer="maintainer + 2FA"
          className="border-dashed"
        />
        <OverviewArrow />
        <PhaseCard
          kind="finalize"
          summary="Publishing the draft cuts the git tag and ships it live, then comments & labels the shipped issues and PRs."
          footer="release: published"
        />
      </div>
    </figure>
  )
}
