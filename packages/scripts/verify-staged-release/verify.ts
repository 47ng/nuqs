#!/usr/bin/env -S node --no-warnings
//
// Staged-release verification — host launcher.
//
// Usage:
//   verify.ts [block-file]    # paste the run-summary block on stdin if omitted
//
// Flow (result-driven, no flags):
//   1. Build the canonical image, reproduce the package inside it, and match
//      the reproduction's digests against the run-summary block (run 1).
//   2. On a hash mismatch, the host downloads the actual staged tarball
//      (assumed safe), cross-checks digests, enumerates the staged list for
//      version-squats, then runs a second sandboxed container that extracts
//      and diffs the two tarballs to show exactly what diverged (run 2).
//
// The host only ever transports bytes and compares registry *metadata* (no
// untrusted-code execution); the package build and the untrusted-tarball
// extraction both happen inside the hardened, read-only sandbox. Runs on
// Node 24 directly via native type-stripping — no build step.

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'

const HELP = `Staged-release verification — host launcher.

Usage:
  verify.ts [block-file]    # paste the run-summary block on stdin if omitted

Reproduces the package in a hardened sandbox and matches its digests against
the run-summary block. On a mismatch it downloads the staged tarball and diffs
its contents to show what diverged. Escalation is automatic — no flags.`

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

// --- args -------------------------------------------------------------------
const { values, positionals } = parseArgs({
  options: { help: { type: 'boolean', short: 'h', default: false } },
  allowPositionals: true,
})

if (values.help) {
  console.log(HELP)
  process.exit(0)
}
if (positionals.length > 1) die(2, `too many arguments: ${positionals.join(' ')}`)
const BLOCK_FILE = positionals[0] ?? ''

const REPO_ROOT = capture('git', ['rev-parse', '--show-toplevel']).trim()

// --- read + parse the run-summary block -------------------------------------
let summaryBlock: string
if (BLOCK_FILE) {
  summaryBlock = readFileSync(BLOCK_FILE, 'utf8')
} else {
  err('Paste the run-summary block, then Ctrl-D:')
  summaryBlock = readFileSync(0, 'utf8') // stdin
}

// Keep only key=value lines (tolerate pasted ``` fences and stray prose).
const summaryFields = new Map<string, string>()
for (const line of summaryBlock.split('\n')) {
  const m = /^([a-z_]+)=(.*)$/.exec(line)
  if (!m) continue
  if (!m[1] || !m[2]) {
    err(`WARN: skipping malformed line in summary block: '${line}'`)
    continue
  }
  if (!summaryFields.has(m[1])) summaryFields.set(m[1], m[2]) // first wins, like `head -1`
}
const field = (k: string): string => summaryFields.get(k) ?? ''

const PACKAGE = field('package')
const VERSION = field('version')
const SHA = field('sha')
const STAGE_ID = field('stage_id')
const SHASUM = field('shasum')
const INTEGRITY = field('integrity')

const missing = (Object.entries({
  package: PACKAGE,
  version: VERSION,
  sha: SHA,
  shasum: SHASUM,
}) as [string, string][]).find(([, v]) => !v)
if (missing) die(1, `block missing '${missing[0]}='`)

// --- clean-tree guard: HEAD must BE the staged commit -----------------------
// Escape hatch (TEST MODE ONLY): VERIFY_ALLOW_TREE_MISMATCH=1 skips the
// clean-tree + HEAD==sha guards so the escalation/diff machinery can be
// exercised from an arbitrary checkout. `git archive HEAD` still ships the
// committed tree, so this only loosens *which* commit is reproduced.
const HEAD_SHA = capture('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD']).trim()
if (process.env.VERIFY_ALLOW_TREE_MISMATCH === '1') {
  err('WARN: VERIFY_ALLOW_TREE_MISMATCH=1 — skipping clean-tree + HEAD==sha guards (TEST MODE).')
  err(`      Reproducing from HEAD ${HEAD_SHA.slice(0, 8)}, not block sha ${SHA.slice(0, 8)}.`)
} else {
  const dirty = spawnSync('git', ['-C', REPO_ROOT, 'diff', '--quiet', 'HEAD']).status !== 0
  if (dirty) {
    die(
      1,
      'FAIL: working tree is dirty — commit or stash so HEAD is exactly the',
      '      staged commit before verifying.',
    )
  }
  if (HEAD_SHA !== SHA) {
    die(
      1,
      `FAIL: HEAD (${HEAD_SHA})`,
      `      != block sha (${SHA}).`,
      '      Check out the staged commit, then re-run.',
    )
  }
}

err('==> Building canonical image')
{
  const r = spawnSync('docker', ['build', '-q', '-t', IMAGE, '.'], {
    cwd: SCRIPT_DIR,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// Fresh tarballs/ each run: clear stale artifacts, recreate the mount target.
rmSync(TARBALLS_DIR, { recursive: true, force: true })
mkdirSync(TARBALLS_DIR, { recursive: true })

// --- hardened sandbox flags -------------------------------------------------
const DOCKER_FLAGS = [
  '--rm', '-i',
  '--read-only',
  '--tmpfs', '/tmp:exec,mode=1777',
  '--tmpfs', '/home/verifier:exec,mode=1777',
  '--cap-drop', 'ALL',
  '--security-opt', 'no-new-privileges',
  '--memory', '6g', '--cpus', '4', '--pids-limit', '2048',
  '-e', `PACKAGE=${PACKAGE}`,
  '-e', `VERSION=${VERSION}`,
]

/**
 * Run a sandboxed stage. `archive` pipes `git archive HEAD` into the
 * container's stdin (run 1 needs the source tree); otherwise stdin is empty.
 */
function runContainer(
  cmd: string,
  extra: string[],
  opts: { archive?: boolean } = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const docker = spawn(
      'docker',
      ['run', ...DOCKER_FLAGS, ...extra, IMAGE, cmd],
      { stdio: [opts.archive ? 'pipe' : 'ignore', 'inherit', 'inherit'] },
    )
    docker.on('error', reject)
    docker.on('close', code => resolve(code ?? 1))
    if (opts.archive) {
      const git = spawn('git', ['-C', REPO_ROOT, 'archive', 'HEAD'], {
        stdio: ['ignore', 'pipe', 'inherit'],
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
err(`==> Verifying ${PACKAGE}@${VERSION} from HEAD (${shortSha}) — reproduce & match hash`)
const run1 = await runContainer(
  'run1.match-hash.sh',
  [
    '-v', `${TARBALLS_DIR}:/out`,
    '-e', `EXPECTED_SHASUM=${SHASUM}`,
    '-e', `EXPECTED_INTEGRITY=${INTEGRITY}`,
  ],
  { archive: true },
)

if (run1 === 0) {
  err('==> PASS — reproduced .tgz matches the staged digests.')
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
  die(1, "==> Hash mismatch, but the block has no 'stage_id=' to download the",
       '    staged tarball. Re-run with a block that includes stage_id=.')
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
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  if (r.status !== 0) die(3, `==> ABORT — 'npm stage download' failed (exit ${r.status}).`)
  return r.stdout
})()

const downloadSchema = z.record(
  z.string(),
  z.object({ shasum: z.string(), integrity: z.string() }),
)
let stagedMeta: { shasum: string; integrity: string } | undefined
try {
  const parsed = downloadSchema.parse(JSON.parse(downloadJson))
  stagedMeta = parsed[PACKAGE] ?? Object.values(parsed)[0]
} catch {
  err("WARN: could not parse 'npm stage download --json' metadata; continuing on file bytes.")
}

const newTgz = readdirSync(TARBALLS_DIR).filter(
  f => f.endsWith('.tgz') && f !== LOCAL_TGZ && !beforeDownload.has(f),
)
if (newTgz.length !== 1) {
  die(3, `==> ABORT — expected exactly one new .tgz from the download, got ${newTgz.length}.`)
}
renameSync(join(TARBALLS_DIR, newTgz[0]!), join(TARBALLS_DIR, STAGED_TGZ))

// 2. Host-side digest cross-check matrix. Distinguishes a stale/lying block
//    from a lying registry from a genuine source divergence.
const localSha = sha1(join(TARBALLS_DIR, LOCAL_TGZ))
const stagedSha = sha1(join(TARBALLS_DIR, STAGED_TGZ))
err('')
err('==> Digest cross-check')
err(`    block.shasum     : ${SHASUM}`)
err(`    registry.shasum  : ${stagedMeta?.shasum ?? '<unparsed>'}`)
err(`    staged.tgz sha1  : ${stagedSha}`)
err(`    local.tgz  sha1  : ${localSha}`)
if (stagedMeta && stagedMeta.shasum !== stagedSha) {
  err('    !! downloaded bytes do NOT match the registry-reported shasum (corruption or lying registry).')
}
if (stagedMeta && stagedMeta.shasum !== SHASUM) {
  err('    !! registry shasum differs from the run-summary block (stale or tampered block).')
}
if (stagedSha === localSha) {
  err('    note: staged.tgz == local.tgz — the run-summary block digests were wrong/stale.')
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
      shasum: z.string(),
    }),
  )
  for (const e of listSchema.parse(JSON.parse(listJson))) {
    let note = '(other version — informational)'
    if (e.shasum === localSha) note = '<= MATCHES your reproduction'
    else if (e.version === VERSION)
      note = '!! SAME VERSION, shasum you CANNOT reproduce — squat? reject + investigate'
    err(`    ${e.version}  ${e.tag ?? '-'}  by ${e.actor ?? '?'}  ${e.createdAt ?? ''}`)
    err(`      shasum ${e.shasum}  ${note}`)
  }
} catch (e) {
  err(`    (could not enumerate staged entries: ${(e as Error).message})`)
}

// 4. Run 2: extract both tarballs in the sandbox and diff their contents.
err('')
err('==> Diffing staged vs local contents in the sandbox')
const run2 = await runContainer('run2.diff-contents.sh', ['-v', `${TARBALLS_DIR}:/in:ro`])

err('')
die(run2 || 21, '==> FAIL — staged bytes are NOT reproducible from HEAD. Do not approve; investigate.')
