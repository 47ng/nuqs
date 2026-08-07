#!/usr/bin/env -S node --no-warnings
//
// Staged-release verification — host launcher.
//
// Usage:
//   verify.staged.ts --package <name> --version <v> --integrity <i> \
//             --shasum <s> [--sha <sha>] [--stage-id <id>]
//   (copy the single ready-to-run command from the Draft Release job summary)
//
// Flow:
//   1. Reproduce the package in the hardened sandbox (verify.lib.ts engine) and
//      match its host-computed digests against the run-summary fields.
//   2. On a mismatch, download the actual staged tarball (assumed safe),
//      cross-check digests, enumerate the staged list for version-squats, then
//      run a second sandboxed container that extracts and diffs the two
//      tarballs to show exactly what diverged.
//
// The host only ever transports bytes and compares registry *metadata* (no
// untrusted-code execution); the build and the untrusted-tarball extraction
// both happen inside the hardened, read-only sandbox. Runs on Node.js directly
// via native type-stripping — no build step.

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs, styleText } from 'node:util'
import { z } from 'zod'
import {
  makeDockerVerifier,
  verdictFor,
  verifyReproducibility,
  VERIFY_IMAGE
} from './verify.lib.ts'

const HELP = `Staged-release verification — host launcher.

Usage:
  verify.staged.ts --package <name> --version <v> --integrity <i> \\
            --shasum <s> [--sha <sha>] [--stage-id <id>]

Pass the run-summary fields as flags — copy the single command the Draft
Release job summary prints. Reproduces the package in a hardened sandbox and
matches its digests against those fields. On a mismatch it downloads the
staged tarball and diffs its contents to show what diverged. Escalation is
automatic.

Required arguments:
  --package <name>      The package name (e.g. nuqs).
  --version <v>         The version string (e.g. 1.2.3).
  --integrity <i>       The staged tarball's sha512 integrity (sha512-…).
                        The primary gate; shasum corroborates it.
  --shasum <s>          The staged tarball's SHA1 (40 hex chars).

Optional:
  --sha <sha>           The staged commit to reproduce. Archived directly
                        (git archive <sha>), so the working tree need not be
                        checked out to it. Defaults to HEAD when omitted.

  --stage-id <id>       The staged release ID (UUID).
                        Only needed if the reproduction fails and you want to
                        download the staged tarball for diffing.
`

const SCRIPT_DIR = import.meta.dirname
const TARBALLS_DIR = join(SCRIPT_DIR, 'tarballs')
const LOCAL_TGZ = 'local.tgz'
const STAGED_TGZ = 'staged.tgz'

const err = (msg = ''): void => void process.stderr.write(msg + '\n')

function die(code: number, ...lines: string[]): never {
  for (const line of lines) err(line)
  process.exit(code)
}

/** Run a command to completion, capturing stdout; throws on non-zero exit. */
function capture(cmd: string, args: string[], cwd?: string): string {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.error) throw r.error
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}\n${r.stderr}`)
  }
  return r.stdout
}

const sha1 = (path: string): string =>
  createHash('sha1').update(readFileSync(path)).digest('hex')

// --- args: the run-summary fields as flags ----------------------------------
const { values } = (() => {
  try {
    return parseArgs({
      options: {
        help: { type: 'boolean', short: 'h', default: false },
        package: { type: 'string' },
        version: { type: 'string' },
        sha: { type: 'string' },
        'stage-id': { type: 'string' },
        integrity: { type: 'string' },
        shasum: { type: 'string' }
      },
      allowPositionals: false
    })
  } catch (e) {
    return die(2, (e as Error).message, '', HELP)
  }
})()

if (values.help) {
  console.log(HELP)
  process.exit(0)
}

// Validate + normalise the flags. integrity is the staged tarball's sha512
// (the primary gate); shasum is its sha1 (40 hex, corroboration); sha is the
// git commit (40 hex today, 64 if the repo ever moves to SHA-256). stage-id is
// only needed for the mismatch-escalation path.
const releaseFieldsSchema = z.object({
  package: z
    .string({ error: 'missing required --package' })
    .min(1, '--package must not be empty'),
  version: z
    .string({ error: 'missing required --version' })
    .min(1, '--version must not be empty'),
  sha: z
    .string()
    .regex(
      /^([0-9a-f]{40}|[0-9a-f]{64})$/,
      '--sha must be a 40- or 64-char hex commit SHA'
    )
    .optional(),
  integrity: z
    .string({ error: 'missing required --integrity' })
    .regex(
      /^sha512-[A-Za-z0-9+/]+={0,2}$/,
      "--integrity must look like 'sha512-…'"
    ),
  shasum: z
    .string({ error: 'missing required --shasum' })
    .regex(/^[0-9a-f]{40}$/, '--shasum must be a 40-char hex sha1'),
  stageId: z.string().min(1, '--stage-id must not be empty').default('')
})

const parsed = releaseFieldsSchema.safeParse({
  package: values.package,
  version: values.version,
  sha: values.sha,
  integrity: values.integrity,
  shasum: values.shasum,
  stageId: values['stage-id']
})
if (!parsed.success) {
  die(2, ...parsed.error.issues.map(i => i.message), '', HELP)
}
const {
  package: PACKAGE,
  version: VERSION,
  sha: SHA,
  stageId: STAGE_ID,
  integrity: INTEGRITY,
  shasum: SHASUM
} = parsed.data

const REPO_ROOT = capture('git', ['rev-parse', '--show-toplevel']).trim()

// The ref to reproduce: the staged commit if given, else HEAD. `git archive`
// ships that commit's tree hermetically, so the working tree need not match it.
const REF = SHA ?? 'HEAD'
if (!SHA) {
  err(styleText('yellow', 'WARN: no --sha given — reproducing from HEAD.'))
}

// Colour decision for our own messages and the sandboxed scripts. docker runs
// without -t (a pseudo-TTY would corrupt run 1's binary git-archive stdin), so
// the relevant terminal is ours; we forward the standard FORCE_COLOR knob.
const wantColor =
  !('NO_COLOR' in process.env) &&
  (process.env.FORCE_COLOR
    ? process.env.FORCE_COLOR !== '0'
    : process.stdout.isTTY === true)

// --- reproduce + match ------------------------------------------------------
err(`==> Verifying ${PACKAGE}@${VERSION} from ${REF} — reproduce & match hash`)
const verifier = makeDockerVerifier({
  scriptDir: SCRIPT_DIR,
  repoRoot: REPO_ROOT,
  outDir: TARBALLS_DIR,
  wantColor
})

// A thrown error here is a could-not-complete condition (docker/build/tooling
// failure, or the ref predating the pins) — exit 2 with a clean message rather
// than crashing with an unhandled rejection. The message carries the kind +
// underlying exit code; escalation only runs for an actual digest mismatch.
const outcome = await verifyReproducibility(
  {
    ref: REF,
    pkg: PACKAGE,
    version: VERSION,
    integrity: INTEGRITY,
    shasum: SHASUM
  },
  verifier
).catch((e: Error) =>
  die(2, styleText('red', `==> could not complete reproduction: ${e.message}`))
)

if (outcome.kind === 'match') {
  // Echo the reproduced vs staged digests so the match is visually checkable.
  err('')
  err(`    reproduced integrity : ${outcome.reproduced.integrity}`)
  err(`    staged     integrity : ${INTEGRITY}`)
  err(`    reproduced shasum    : ${outcome.reproduced.shasum}`)
  err(`    staged     shasum    : ${SHASUM}`)
  err(
    styleText('green', '==> PASS — reproduced .tgz matches the staged digests.')
  )
  process.exit(0)
}

if (outcome.kind === 'toolchain-mismatch') {
  const verdict = verdictFor(outcome, {
    pkg: PACKAGE,
    version: VERSION,
    ref: REF
  })
  die(verdict.code, styleText('red', verdict.summary), ...verdict.details)
}

// --- escalation (reproduction succeeded but digests differ) -----------------
const localSha = outcome.reproduced.shasum
err('')
err(styleText('red', '==> Hash mismatch — reproduced .tgz != staged digests.'))
err(`    reproduced integrity : ${outcome.reproduced.integrity}`)
err(`    staged     integrity : ${INTEGRITY}`)
err(`    reproduced shasum    : ${localSha}`)
err(`    staged     shasum    : ${SHASUM}`)

if (!STAGE_ID) {
  die(
    1,
    styleText(
      'red',
      `==> No --stage-id was given to download the staged tarball for diffing.
  Re-run with the --stage-id option to see the content diff.`
    )
  )
}

// 1. Download the actual staged tarball (host-side; npm CLI assumed auth'd).
err(`==> Downloading staged tarball (stage ${STAGE_ID})`)
const beforeDownload = new Set(readdirSync(TARBALLS_DIR))
const downloadJson = (() => {
  const r = spawnSync('npm', ['stage', 'download', STAGE_ID, '--json'], {
    cwd: TARBALLS_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  })
  if (r.status !== 0)
    die(3, `==> ABORT — 'npm stage download' failed (exit ${r.status}).`)
  return r.stdout
})()

const downloadSchema = z.record(
  z.string(),
  z.object({ integrity: z.string(), shasum: z.string() })
)
let stagedMeta: { integrity: string; shasum: string } | undefined
try {
  const meta = downloadSchema.parse(JSON.parse(downloadJson))
  stagedMeta = meta[PACKAGE] ?? Object.values(meta)[0]
} catch {
  err(
    "WARN: could not parse 'npm stage download --json' metadata; continuing on file bytes."
  )
}

const newTgz = readdirSync(TARBALLS_DIR).filter(
  f => f.endsWith('.tgz') && f !== LOCAL_TGZ && !beforeDownload.has(f)
)
if (newTgz.length !== 1) {
  die(
    3,
    `==> ABORT — expected exactly one new .tgz from the download, got ${newTgz.length}.`
  )
}
renameSync(join(TARBALLS_DIR, newTgz[0]!), join(TARBALLS_DIR, STAGED_TGZ))

// 2. Host-side digest cross-check matrix.
const stagedSha = sha1(join(TARBALLS_DIR, STAGED_TGZ))
err('')
err('==> Digest cross-check')
err(`    --shasum         : ${SHASUM}`)
err(`    registry.shasum  : ${stagedMeta?.shasum ?? '<unparsed>'}`)
err(`    staged.tgz sha1  : ${stagedSha}`)
err(`    local.tgz  sha1  : ${localSha}`)
if (stagedMeta && stagedMeta.shasum !== stagedSha) {
  err(
    '    !! downloaded bytes do NOT match the registry-reported shasum (corruption or lying registry).'
  )
}
if (stagedMeta && stagedMeta.shasum !== SHASUM) {
  err(
    '    !! registry shasum differs from the given --shasum (stale or tampered argument).'
  )
}
if (stagedSha === localSha) {
  err(
    '    note: staged.tgz == local.tgz — the given --shasum/--integrity were wrong/stale.'
  )
}

// 3. Enumerate the staged list and flag version-squats.
err('')
err(`==> Staged entries for ${PACKAGE}`)
try {
  const listJson = capture('npm', ['stage', 'list', PACKAGE, '--json'])
  const listSchema = z.array(
    z.object({
      version: z.string(),
      tag: z.string().optional(),
      actor: z.string().optional(),
      createdAt: z.string().optional(),
      shasum: z.string()
    })
  )
  for (const e of listSchema.parse(JSON.parse(listJson))) {
    let note = '(other version — informational)'
    if (e.shasum === localSha) note = '<= MATCHES your reproduction'
    else if (e.version === VERSION)
      note =
        '!! SAME VERSION, shasum you CANNOT reproduce — squat? reject + investigate'
    err(
      `    ${e.version}  ${e.tag ?? '-'}  by ${e.actor ?? '?'}  ${e.createdAt ?? ''}`
    )
    err(`      shasum ${e.shasum}  ${note}`)
  }
} catch (e) {
  err(`    (could not enumerate staged entries: ${(e as Error).message})`)
}

// 4. Diff staged vs local contents in the sandbox (run 2).
err('')
err('==> Diffing staged vs local contents in the sandbox')
const run2 = await runRun2()
err('')
die(
  run2 || 21,
  styleText(
    'red',
    '==> FAIL — staged bytes are NOT reproducible. Do not approve; investigate.'
  )
)

/**
 * Run 2 — extract both tarballs in the sandbox and diff their contents. Staged
 * only: the diff is inherently container-side, so it isn't part of the shared
 * engine. Mounts the tarballs dir read-only; no git-archive stdin.
 */
function runRun2(): Promise<number> {
  const flags = [
    '--rm',
    '--read-only',
    '--tmpfs',
    '/tmp:exec,mode=1777',
    '--tmpfs',
    '/home/verifier:exec,mode=1777',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--memory',
    '6g',
    '--cpus',
    '4',
    '--pids-limit',
    '2048',
    '-e',
    `PACKAGE=${PACKAGE}`,
    '-e',
    `VERSION=${VERSION}`,
    ...(wantColor ? ['-e', 'FORCE_COLOR=1'] : []),
    '-v',
    `${TARBALLS_DIR}:/in:ro`
  ]
  return new Promise((resolve, reject) => {
    const docker = spawn(
      'docker',
      ['run', ...flags, VERIFY_IMAGE, 'run2.diff-contents.sh'],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    )
    docker.on('error', reject)
    docker.on('close', code => resolve(code ?? 1))
  })
}
