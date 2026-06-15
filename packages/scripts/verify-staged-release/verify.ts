#!/usr/bin/env -S node --no-warnings
//
// Staged-release verification — host launcher.
//
// Usage:
//   verify.ts --package <name> --version <v> --shasum <s> \
//             [--sha <sha>] [--stage-id <id>] [--integrity <i>]
//   (copy the single ready-to-run command from the Draft Release job summary)
//
// Flow (result-driven, no flags):
//   1. Build the canonical image, reproduce the package inside it, and match
//      the reproduction's digests against the run-summary fields (run 1).
//   2. On a hash mismatch, the host downloads the actual staged tarball
//      (assumed safe), cross-checks digests, enumerates the staged list for
//      version-squats, then runs a second sandboxed container that extracts
//      and diffs the two tarballs to show exactly what diverged (run 2).
//
// The host only ever transports bytes and compares registry *metadata* (no
// untrusted-code execution); the package build and the untrusted-tarball
// extraction both happen inside the hardened, read-only sandbox. Runs on
// Node.js 24 directly via native type-stripping — no build step.

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync
} from 'node:fs'
import { join } from 'node:path'
import { parseArgs, styleText } from 'node:util'
import { z } from 'zod'

const HELP = `Staged-release verification — host launcher.

Usage:
  verify.ts --package <name> --version <v> --shasum <s> \\
            [--sha <sha>] [--stage-id <id>] [--integrity <i>]

Pass the run-summary fields as flags — copy the single command the Draft
Release job summary prints. Reproduces the package in a hardened sandbox and
matches its digests against those fields. On a mismatch it downloads the
staged tarball and diffs its contents to show what diverged. Escalation is
automatic.

Required arguments:
  --package <name>      The package name (e.g. nuqs, @47ng/codec).
  --version <v>         The version string (e.g. 1.2.3).
  --shasum <s>          The staged tarball's SHA1 (40 hex chars).

Optional:
  --sha <sha>           The staged commit SHA1 (40 or 64 hex chars).
                        If provided, checks that <sha> == HEAD on a clean working tree.
                        If omitted, the script reproduces from HEAD instead.

  --stage-id <id>       The staged release ID (UUID).
                        Only needed if the reproduction fails and you want to
                        download the staged tarball for diffing.

  --integrity <i>       The staged tarball's integrity (e.g. sha512-…).
                        Only needed if the reproduction fails and you want to
                        download the staged tarball for diffing.
`

const IMAGE = 'nuqs-verify-staged:latest'
const SCRIPT_DIR = import.meta.dirname
const TARBALLS_DIR = join(SCRIPT_DIR, 'tarballs')
const LOCAL_TGZ = 'local.tgz'
const STAGED_TGZ = 'staged.tgz'

const err = (msg = ''): void => void process.stderr.write(msg + '\n')

/** Run a command to completion, capturing stdout; throws on non-zero exit. */
function capture(cmd: string, args: string[], cwd?: string): string {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.error) throw r.error
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}\n${r.stderr}`)
  }
  return r.stdout
}

function die(code: number, ...lines: string[]): never {
  for (const line of lines) err(line)
  process.exit(code)
}

const sha1 = (path: string): string =>
  createHash('sha1').update(readFileSync(path)).digest('hex')

// --- args: the run-summary fields as flags ----------------------------------
// The Draft Release job summary prints a single ready-to-run command, each
// field passed as a --flag (no stdin, no block file to paste). parseArgs is
// strict: an unknown flag or a flag missing its value fails loud below.
const { values } = (() => {
  try {
    return parseArgs({
      options: {
        help: { type: 'boolean', short: 'h', default: false },
        package: { type: 'string' },
        version: { type: 'string' },
        sha: { type: 'string' },
        'stage-id': { type: 'string' },
        shasum: { type: 'string' },
        integrity: { type: 'string' }
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

// Validate + normalise the flags into the shape the rest of the script uses.
// shasum is a tarball sha1 (40 hex); sha is the git commit (40 hex today, 64
// if the repo ever moves to SHA-256). stage-id and integrity are only needed
// for the mismatch-escalation path, so they default to '' (treated as absent).
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
  shasum: z
    .string({ error: 'missing required --shasum' })
    .regex(/^[0-9a-f]{40}$/, '--shasum must be a 40-char hex sha1'),
  stageId: z.string().min(1, '--stage-id must not be empty').default(''),
  integrity: z
    .string()
    .regex(
      /^sha\d+-[A-Za-z0-9+/]+={0,2}$/,
      "--integrity must look like 'sha512-…'"
    )
    .default('')
})
type ReleaseFields = z.infer<typeof releaseFieldsSchema>

const parsed = releaseFieldsSchema.safeParse({
  package: values.package,
  version: values.version,
  sha: values.sha,
  shasum: values.shasum,
  stageId: values['stage-id'],
  integrity: values.integrity
})
if (!parsed.success) {
  die(2, ...parsed.error.issues.map(i => i.message), '', HELP)
}
const fields: ReleaseFields = parsed.data

const REPO_ROOT = capture('git', ['rev-parse', '--show-toplevel']).trim()

const {
  package: PACKAGE,
  version: VERSION,
  sha: SHA,
  stageId: STAGE_ID,
  shasum: SHASUM,
  integrity: INTEGRITY
} = fields

// --- clean-tree guard: HEAD must BE the staged commit -----------------------
// Test-mode escape hatch: omitting --sha skips the clean-tree + HEAD==sha
// guards so the escalation/diff machinery can be exercised from an arbitrary
// checkout. `git archive HEAD` still ships the committed tree, so this only
// loosens *which* commit is reproduced.
const HEAD_SHA = capture('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD']).trim()
if (!SHA) {
  err(
    styleText(
      'yellow',
      `WARN: no --sha argument provided: skipping clean-tree + HEAD==sha guards (TEST MODE).
  Reproducing from HEAD (${HEAD_SHA.slice(0, 8)}).`
    )
  )
} else {
  const dirty =
    spawnSync('git', ['-C', REPO_ROOT, 'diff', '--quiet', 'HEAD']).status !== 0
  if (dirty) {
    die(
      1,
      styleText(
        'red',
        `FAIL: working tree is dirty — commit or stash so HEAD is exactly the
  staged commit before verifying.`
      )
    )
  }
  if (HEAD_SHA !== SHA) {
    die(
      1,
      styleText(
        'red',
        `FAIL: Git tree mismatch:
   HEAD ${HEAD_SHA}
  --sha ${SHA}
  Check out the staged commit, then re-run.`
      )
    )
  }
}

// Tool versions for the sandbox come straight from the canonical sources CI
// uses, so the image matches the runner that produced the staged tarball:
//   - node : repo-root .node-version (what actions/setup-node reads); its
//            bundled zlib decides the gzip layer of the tarball.
//   - npm  : repo-root .npm-version — the same file release-draft.yml's stage
//            job reads to install the npm that builds the staged tarball.
//   - pnpm : package.json "packageManager" (what corepack/CI resolves).
// Each is passed as a --build-arg that always overrides the Dockerfile ARG
// default (those defaults exist only for a standalone `docker build`).
function derivePin(
  label: string,
  file: string,
  extract: (raw: string) => string | undefined
): string {
  const v = extract(readFileSync(join(REPO_ROOT, file), 'utf8'))
    ?.trim()
    .replace(/^v/, '')
  if (!v || !/^\d+\.\d+\.\d+$/.test(v)) {
    die(
      2,
      `FAIL: could not derive a pinned x.y.z ${label} version from ${file}${v ? ` (got '${v}')` : ''}`
    )
  }
  return v
}

const NODE_VERSION = derivePin('node', '.node-version', raw => raw)
const NPM_VERSION = derivePin('npm', '.npm-version', raw => raw)
const PNPM_VERSION = derivePin('pnpm', 'package.json', raw => {
  const pm =
    (JSON.parse(raw) as { packageManager?: string }).packageManager ?? ''
  return /^pnpm@(\d+\.\d+\.\d+)/.exec(pm)?.[1]
})

err(
  `==> Building canonical image (node ${NODE_VERSION}, npm ${NPM_VERSION}, pnpm ${PNPM_VERSION})`
)
{
  const r = spawnSync(
    'docker',
    [
      'build',
      '-q',
      '--build-arg',
      `NODE_VERSION=${NODE_VERSION}`,
      '--build-arg',
      `NPM_VERSION=${NPM_VERSION}`,
      '--build-arg',
      `PNPM_VERSION=${PNPM_VERSION}`,
      '-t',
      IMAGE,
      '.'
    ],
    {
      cwd: SCRIPT_DIR,
      stdio: ['ignore', 'ignore', 'inherit']
    }
  )
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// --- toolchain assertion ----------------------------------------------------
// The --build-args above are meant to override the Dockerfile's ARG defaults; a
// typo in a flag name or default drift would silently bake the wrong toolchain
// and surface only as a confusing hash mismatch later. So run the freshly built
// image and assert its node/npm/pnpm are exactly what we fed the build. This is
// a runtime check, not a build-time print: a cached RUN layer never re-runs, and
// `docker build -q` swallows build output anyway. No mounts, all caps dropped —
// it only invokes `--version`.
err('==> Verifying sandbox toolchain matches the pinned versions')
{
  const r = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      IMAGE,
      'sh',
      '-c',
      'node --version; npm --version; pnpm --version'
    ],
    { encoding: 'utf8' }
  )
  if (r.status !== 0) {
    die(
      r.status ?? 1,
      styleText(
        'red',
        `FAIL: could not query the sandbox toolchain (docker exit ${r.status}).`
      ),
      r.stderr ?? ''
    )
  }
  const [gotNode, gotNpm, gotPnpm] = r.stdout
    .trim()
    .split('\n')
    .map(s => s.trim().replace(/^v/, ''))
  const mismatches = (
    [
      ['node', gotNode, NODE_VERSION],
      ['npm', gotNpm, NPM_VERSION],
      ['pnpm', gotPnpm, PNPM_VERSION]
    ] as const
  ).filter(([, got, want]) => got !== want)
  if (mismatches.length > 0) {
    die(
      2,
      styleText(
        'red',
        'FAIL: sandbox toolchain does not match the pinned versions — the\n  --build-args did not take (check the verify.ts ↔ Dockerfile wiring):'
      ),
      ...mismatches.map(
        ([label, got, want]) =>
          `  ${label}: image has ${got || '<none>'}, expected ${want}`
      )
    )
  }
}

// Fresh tarballs/ each run: clear stale artifacts, recreate the mount target.
rmSync(TARBALLS_DIR, { recursive: true, force: true })
mkdirSync(TARBALLS_DIR, { recursive: true })

// Decide colour for the sandboxed scripts. Their stdout is inherited by this
// process (docker runs without -t — a pseudo-TTY would corrupt run 1's binary
// git-archive stdin), so the relevant terminal is ours, not the container's.
// We translate that decision into the standard FORCE_COLOR knob the scripts
// (and the build tooling whose logs run 1 surfaces on failure) already honour,
// rather than a bespoke variable. Same NO_COLOR / FORCE_COLOR conventions
// styleText applies to our own messages.
const wantColor =
  !('NO_COLOR' in process.env) &&
  (process.env.FORCE_COLOR
    ? process.env.FORCE_COLOR !== '0'
    : process.stdout.isTTY === true)

// --- hardened sandbox flags -------------------------------------------------
const DOCKER_FLAGS = [
  '--rm',
  '-i',
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
  // Only forward FORCE_COLOR when we want colour; absent, the scripts fall back
  // to their own (always-false) in-sandbox TTY check and stay plain.
  ...(wantColor ? ['-e', 'FORCE_COLOR=1'] : [])
]

/**
 * Run a sandboxed stage. `archive` pipes `git archive HEAD` into the
 * container's stdin (run 1 needs the source tree); otherwise stdin is empty.
 */
function runContainer(
  cmd: string,
  extra: string[],
  opts: { archive?: boolean } = {}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const docker = spawn(
      'docker',
      ['run', ...DOCKER_FLAGS, ...extra, IMAGE, cmd],
      { stdio: [opts.archive ? 'pipe' : 'ignore', 'inherit', 'inherit'] }
    )
    docker.on('error', reject)
    docker.on('close', code => resolve(code ?? 1))
    if (opts.archive) {
      const git = spawn('git', ['-C', REPO_ROOT, 'archive', 'HEAD'], {
        stdio: ['ignore', 'pipe', 'inherit']
      })
      git.on('error', reject)
      if (!git.stdout || !docker.stdin) {
        reject(new Error('failed to open the git-archive → container pipe'))
        return
      }
      git.stdout.pipe(docker.stdin)
    }
  })
}

const shortSha = HEAD_SHA.slice(0, 8)

// --- run 1: reproduce + match digests ---------------------------------------
err(
  `==> Verifying ${PACKAGE}@${VERSION} from HEAD (${shortSha}) — reproduce & match hash`
)
const run1 = await runContainer(
  'run1.match-hash.sh',
  [
    '-v',
    `${TARBALLS_DIR}:/out`,
    '-e',
    `EXPECTED_SHASUM=${SHASUM}`,
    '-e',
    `EXPECTED_INTEGRITY=${INTEGRITY}`
  ],
  { archive: true }
)

if (run1 === 0) {
  err(
    styleText('green', '==> PASS — reproduced .tgz matches the staged digests.')
  )
  process.exit(0)
}
if (run1 !== 20) {
  // 1/2 = tooling error inside the build; 125/126/127/128+N = docker infra.
  // Either way the reproduction never completed, so there is nothing to diff.
  const kind = run1 >= 125 ? 'docker/infrastructure' : 'build/tooling'
  die(run1, `==> ABORT — ${kind} error (exit ${run1}); not escalating.`)
}

// --- escalation (run 1 exited 20: reproduction succeeded but digests differ) -
if (!STAGE_ID) {
  die(
    1,
    styleText(
      'red',
      `==> Hash mismatch, but no --stage-id was given to download the staged tarball.
  Re-run with the --stage-id option included.`
    )
  )
}

// 1. Download the actual staged tarball (host-side; npm CLI assumed auth'd).
//    --json streams metadata on stdout (notices go to stderr); the file lands
//    in cwd under an npm-chosen name that carries the stage id, so we don't
//    trust the name — we glob the new .tgz and normalise it to staged.tgz.
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
  z.object({ shasum: z.string(), integrity: z.string() })
)
let stagedMeta: { shasum: string; integrity: string } | undefined
try {
  const parsed = downloadSchema.parse(JSON.parse(downloadJson))
  stagedMeta = parsed[PACKAGE] ?? Object.values(parsed)[0]
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

// 2. Host-side digest cross-check matrix. Distinguishes stale/lying arguments
//    from a lying registry from a genuine source divergence.
const localSha = sha1(join(TARBALLS_DIR, LOCAL_TGZ))
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

// 3. Enumerate the staged list and flag version-squats (a staged entry on our
//    version whose shasum we cannot reproduce).
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

// 4. Run 2: extract both tarballs in the sandbox and diff their contents.
err('')
err('==> Diffing staged vs local contents in the sandbox')
const run2 = await runContainer('run2.diff-contents.sh', [
  '-v',
  `${TARBALLS_DIR}:/in:ro`
])

err('')
die(
  run2 || 21,
  styleText(
    'red',
    '==> FAIL — staged bytes are NOT reproducible from HEAD. Do not approve; investigate.'
  )
)
