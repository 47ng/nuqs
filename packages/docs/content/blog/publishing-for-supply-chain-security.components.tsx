import {
  CommitDot,
  CommitGraph,
  RefBadge,
  type Commit
} from '@/src/components/commit-graph'
import { ContainerQueryHelper } from '@/src/components/responsive-helpers'
import { cn } from '@/src/lib/utils'
import { SiGithub, SiNpm } from '@icons-pack/react-simple-icons'
import { ArrowDown, ArrowRight } from 'lucide-react'
import {
  Fragment,
  type ComponentProps,
  type CSSProperties,
  type ReactNode
} from 'react'
import {
  FastForwardGraph,
  MeasuredDiagram,
  type Connector
} from './publishing-for-supply-chain-security.client'

export const Arrow = () => (
  <ArrowRight className="-mt-px inline size-[1em]" aria-label="→" />
)

// The agnostic (server-rendered) layer: static diagram markup plus the plain
// data the diagrams need, shipping no client JS. The interactive parts — the
// DOM-measured arrows — live in the sibling `.client.tsx` and are slotted in via
// composition (`FastForwardGraph` as a leaf, `MeasuredDiagram` as a donut around
// the server-rendered markup). The commit graph is itself a client component,
// but the server renders it directly now that its colours are data, not
// functions.

// Publishing, defined ---------------------------------------------------------

// One point in Git fans out to the two published artifacts.
const processConnectors: Connector[] = [
  {
    from: 'source',
    fromSide: 'right',
    to: 'npm',
    toSide: 'left',
    color: '#a1a1aa' // zinc-400
  },
  {
    from: 'source',
    fromSide: 'right',
    to: 'release',
    toSide: 'left',
    color: '#a1a1aa'
  }
]

function ProcessNode({
  logo,
  anchor,
  title,
  detail
}: {
  logo: ReactNode
  anchor: string
  title: string
  detail: string
}) {
  return (
    <div
      data-anchor={anchor}
      className="border-border/70 bg-muted/30 flex w-52 shrink-0 items-center gap-3 rounded-xl border px-4 py-3"
    >
      {logo}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">{title}</span>
        <code className="text-muted-foreground/80 font-mono text-xs">
          {detail}
        </code>
      </div>
    </div>
  )
}

export function PublishingProcess() {
  return (
    <figure className="not-prose border-border/60 bg-card @container my-8 overflow-x-auto rounded-xl border shadow-sm">
      <MeasuredDiagram
        connectors={processConnectors}
        className="relative flex min-w-128 items-center justify-between gap-12 px-8 py-8"
      >
        {/* A point in Git, composed from the commit-graph's own vocabulary. It
            grows with the available width via container queries (@container on
            the figure): hash only when narrow, then the commit message, then
            the author — the same columns a commit-graph row reveals.
            #3b82f6 is the colour `next` takes there (rail 0, unmapped). */}
        <div
          data-anchor="source"
          className="border-border/70 bg-muted/30 inline-flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3"
        >
          <CommitDot color="#3b82f6" />
          <RefBadge color="#3b82f6">next</RefBadge>
          <code className="text-muted-foreground/80 font-mono text-xs">
            29990b5f
          </code>
          <span className="text-foreground/80 hidden text-sm @2xl:inline">
            chore: release nuqs 2.9.0
          </span>
          <span className="text-muted-foreground hidden text-xs @3xl:inline">
            François Best
          </span>
        </div>
        <div className="flex flex-col gap-6">
          <ProcessNode
            logo={
              <span className="relative inline-flex shrink-0 before:absolute before:inset-[15%] before:bg-white before:content-['']">
                <SiNpm className="relative fill-[#cb0200]" />
              </span>
            }
            anchor="npm"
            title="npm registry"
            detail="nuqs@2.9.0"
          />
          <ProcessNode
            logo={<SiGithub />}
            anchor="release"
            title="GitHub release"
            detail="v2.9.0 + changelog"
          />
        </div>
        <ContainerQueryHelper />
      </MeasuredDiagram>
    </figure>
  )
}

// Commit-graph figure ---------------------------------------------------------

const author = { name: 'François Best' }

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

// `master` is the release branch (green); the release tags are amber. Everything
// else (e.g. `next`) falls through to the graph's default rail colour.
const commitRefColors = { master: '#22c55e' } // green-500
const commitTagColors = {
  'v2.8.0': '#f59e0b', // amber-500
  'v2.9.0': '#f59e0b'
}

export function AdvanceMasterToNext() {
  return (
    <figure className="not-prose my-8 flex flex-col items-stretch gap-3">
      <div className="flex flex-col gap-2">
        <figcaption className="text-muted-foreground text-sm">
          <code>master</code> trails <code>next</code>
        </figcaption>
        <CommitGraph
          commits={before}
          refColors={commitRefColors}
          tagColors={commitTagColors}
        />
      </div>
      <ArrowDown
        aria-label="fast-forward then tag a release"
        className="text-muted-foreground mx-auto size-5 shrink-0"
      />
      <div className="flex flex-col gap-2">
        <figcaption className="text-muted-foreground text-sm">
          fast-forwarded, then tagged by <code>semantic-release</code>
        </figcaption>
        <FastForwardGraph
          commits={after}
          refColors={commitRefColors}
          tagColors={commitTagColors}
        />
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
      className="rounded-lg border px-5 py-1.5 text-center text-sm font-semibold"
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
        className="relative min-w-176 px-8 pt-16 pb-6"
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
            className="border-muted-foreground/40 rounded-2xl border border-dashed p-5"
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

        <div className="flex items-center justify-center pt-10">
          <code
            data-anchor="inspect"
            className="text-muted-foreground ml-6 w-fit font-mono text-xs"
          >
            Inspect tarball
          </code>
        </div>
      </MeasuredDiagram>
    </figure>
  )
}

// Release-pipeline diagrams ---------------------------------------------------

// One hue for every elevated permission, outside the phase palette,
// so badges read as a single category rather than echoing a phase.
const permissionColor = '#f43f5e' // rose-500

// Visual language mirrors the yml structure: phase-tinted frame = workflow,
// solid card = job (the permission boundary), divided rows = steps.
type Job = {
  id: string
  detail: ReactNode
  permissions?: string[]
}

type Step = {
  name: string
  detail: string
}

function PermissionBadge({ label }: { label: string }) {
  return (
    <code
      className="shrink-0 rounded-full border px-2 font-mono text-xs leading-loose font-medium"
      style={{
        color: permissionColor,
        borderColor: `${permissionColor}40`,
        backgroundColor: `${permissionColor}14`
      }}
    >
      {label}
    </code>
  )
}

function JobNode({ job, children }: { job: Job; children?: ReactNode }) {
  const permissions = job.permissions ?? []
  return (
    <div className="border-border/70 bg-muted/30 rounded-lg border px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-foreground font-mono text-sm font-medium">
            {job.id}
          </span>
          <span className="text-muted-foreground/70 text-xs">{job.detail}</span>
        </div>
        {permissions.length === 1 && <PermissionBadge label={permissions[0]} />}
      </div>
      {permissions.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {permissions.map(scope => (
            <PermissionBadge key={scope} label={scope} />
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

function StepList({ steps }: { steps: Step[] }) {
  return (
    <div className="divide-border/60 mt-2 -mb-2 divide-y">
      {steps.map(step => (
        <div key={step.name} className="flex flex-col gap-0.5 py-2.5">
          <span className="text-foreground text-sm font-medium">
            {step.name}
          </span>
          <span className="text-muted-foreground/70 text-xs">
            {step.detail}
          </span>
        </div>
      ))}
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

function JobPipeline({ jobs }: { jobs: Job[] }) {
  return (
    <div className="flex flex-col">
      {jobs.map((job, i) => (
        <Fragment key={job.id}>
          {i > 0 && <FlowArrow />}
          <JobNode job={job} />
        </Fragment>
      ))}
    </div>
  )
}

function WorkflowGroup({
  name,
  phase,
  children
}: {
  name: string
  phase: Phase
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        `border-muted-foreground/40 rounded-2xl border p-4`,
        phaseBorder[phase]
      )}
    >
      <code
        className={`mb-3 block font-mono text-sm font-semibold ${phaseText[phase]}`}
      >
        {name}
      </code>
      {children}
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
const draftJobs: Job[] = [
  {
    id: 'compute-version',
    detail: (
      <>
        walk the commit tree <Arrow /> next semver
      </>
    )
  },
  {
    id: 'generate-notes',
    detail: 'render the changelog from the commit graph'
  },
  { id: 'ci', detail: 'full test suite (reusable ci-cd.yml)' },
  {
    id: 'stage',
    detail: 'npm stage publish, with provenance',
    permissions: ['id-token: write']
  },
  {
    id: 'create-draft',
    detail: 'open the draft GitHub release',
    permissions: ['contents: write']
  }
]

// The workflow's single least-privilege job, and its meaningful steps.
const finalizeJob: Job = {
  id: 'finalize',
  detail: 'notify on completion',
  permissions: ['issues: write', 'pull-requests: write', 'discussions: write']
}

const finalizeSteps: Step[] = [
  {
    name: 'Verify live on npm',
    detail: 'registry curl — bails if the 2FA approval was skipped'
  },
  {
    name: 'Comment + label issues & PRs',
    detail: 'derived from the commit graph, idempotent on re-runs'
  },
  {
    name: 'Bust docs ISR caches',
    detail: 'contributors + changelog, stable releases only'
  },
  {
    name: 'Notify on Slack',
    detail: 'always — release card or failure notice'
  }
]

export function ReleaseDraftJobs() {
  return (
    <figure className="not-prose border-border/60 bg-card my-8 rounded-xl border p-6 shadow-sm">
      <div className="mx-auto flex max-w-md flex-col">
        <TriggerChip>workflow_dispatch</TriggerChip>
        <FlowArrow />
        <WorkflowGroup name="release-draft.yml" phase="draft">
          <JobPipeline jobs={draftJobs} />
        </WorkflowGroup>
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
        <WorkflowGroup name="release-finalize.yml" phase="finalize">
          <JobNode job={finalizeJob}>
            <StepList steps={finalizeSteps} />
          </JobNode>
        </WorkflowGroup>
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

// Branch names coloured to match the commit graph: `master` the release branch
// (green), `next` the trunk (rail-0 blue). Stays a prose <code> — we just
// override the three CSS variables fumadocs' inline-code rule reads, so it keeps
// the code shape (radius, padding) but takes the branch hue, border included,
// with the same 10%/40% tints as the graph's ref badges.
const branchColor = {
  master: '#22c55e', // green-500
  next: '#3b82f6' // blue-500 (rail 0)
}

export function Branch({ name }: { name: keyof typeof branchColor }) {
  const color = branchColor[name]
  return (
    <code
      style={
        {
          '--tw-prose-code': color,
          '--color-fd-muted': `${color}10`,
          '--color-fd-border': `${color}40`
        } as CSSProperties
      }
    >
      {name}
    </code>
  )
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
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-green-500/60 text-xs font-bold text-green-600 dark:text-green-400">
            ?
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">{summary}</p>
      <code className="text-muted-foreground/70 mt-auto font-mono text-xs">
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
      <div className="flex min-w-168 items-stretch justify-center gap-3">
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
          summary="Publishing the draft creates the Git tag on GitHub, then comments & labels land on the shipped issues and PRs."
          footer="release: published"
        />
      </div>
    </figure>
  )
}
