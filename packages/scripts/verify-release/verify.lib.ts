//
// Reproducible-release verification — shared engine.
//
// This module is flavour-agnostic: it knows how to reproduce a package in the
// hardened sandbox and decide whether the reproduction matches a set of
// expected digests. The staged and production CLIs (verify.staged.ts /
// verify.production.ts) supply the inputs and own the I/O around it.
//
// The decision logic (`verifyReproducibility` + the pure helpers) is the host's
// final word: the sandbox only ever reports raw reproduced bytes, and the host
// hashes + compares. That keeps the verdict testable with an in-memory
// `Verifier` and out of reach of untrusted build code.
//

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { isValidSemver } from '../lib/version.ts'

export type Toolchain = {
  node: string
  npm: string
  pnpm: string
}

// --- tag / version ----------------------------------------------------------

/** A git tag and its npm version: the tag is v-prefixed, the version is not. */
export type TagVersion = { tag: string; version: string }

/**
 * Normalise `v1.2.3` or `1.2.3` (with optional prerelease suffix) into a
 * `{ tag, version }` pair. Throws on anything that isn't a release version.
 */
export function normalizeTag(input: string): TagVersion {
  const version = input.trim().replace(/^v/, '')
  if (!isValidSemver(version)) {
    throw new Error(`not a valid release version: '${input}'`)
  }
  return { tag: `v${version}`, version }
}

/** A tarball's digest pair: npm SRI integrity (sha512) + legacy sha1 shasum. */
export type Digests = {
  integrity: string // npm integrity: `sha512-` + base64(sha512(.tgz))
  shasum: string // sha1 hex of the .tgz
}

/** A reproduced tarball, as hashed on the host from the sandbox's output. */
export type Reproduction = Digests & {
  localTgz: string // host path to the reproduced tarball (staged diff needs it)
}

export type ReproduceInput = {
  ref: string
  pkg: string
  version: string
}

export type VerifyInput = ReproduceInput & Digests

// The I/O surface the engine consumes. Production wires `makeDockerVerifier`
// (docker + git + fs); tests inject an in-memory fake, controlling the returned
// data and asserting the inputs it was called with.
export type Verifier = {
  readToolchainPins: (ref: string) => Toolchain
  buildImage: (pins: Toolchain) => void
  readSandboxToolchain: () => Toolchain
  reproduce: (input: ReproduceInput) => Promise<Reproduction>
}

// --- toolchain pins ---------------------------------------------------------
// The pinned node/npm/pnpm versions are hash-critical: node's bundled zlib
// decides the gzip layer of the tarball, so the sandbox must build with exactly
// the toolchain the verified commit shipped. These parse the canonical sources
// (.node-version, .npm-version, package.json#packageManager) read at the ref.

/** Parse a pinned x.y.z version from a raw pin source; throws on malformed input. */
export function parsePin(label: string, raw: string | undefined): string {
  const v = raw?.trim().replace(/^v/, '')
  if (!v || !/^\d+\.\d+\.\d+$/.test(v)) {
    throw new Error(
      `could not derive a pinned x.y.z ${label} version${v ? ` (got '${v}')` : ''}`
    )
  }
  return v
}

/** Extract pnpm's pinned x.y.z from a package.json's `packageManager` field. */
export function parsePnpmPin(packageJsonRaw: string): string | undefined {
  const pm =
    (JSON.parse(packageJsonRaw) as { packageManager?: string })
      .packageManager ?? ''
  return /^pnpm@(\d+\.\d+\.\d+)/.exec(pm)?.[1]
}

/** Build a `Toolchain` from the raw contents of the three canonical pin sources. */
export function parseToolchain(raw: {
  nodeVersion: string
  npmVersion: string
  packageJson: string
}): Toolchain {
  return {
    node: parsePin('node', raw.nodeVersion),
    npm: parsePin('npm', raw.npmVersion),
    pnpm: parsePin('pnpm', parsePnpmPin(raw.packageJson))
  }
}

// --- registry metadata ------------------------------------------------------
// Read straight from the canonical public registry (not `npm view`): going
// direct avoids a mirror/proxy in the user's npm config substituting different
// bytes into the comparison. Public packages need no auth.

const REGISTRY = 'https://registry.npmjs.org'

export const registryMetaSchema = z.object({
  version: z.string(),
  gitHead: z
    .string()
    .regex(/^[0-9a-f]{40}$/)
    .optional(),
  dist: z.object({
    integrity: z
      .string()
      .regex(/^sha512-/, 'dist.integrity must be a sha512 integrity'),
    shasum: z.string().regex(/^[0-9a-f]{40}$/, 'dist.shasum must be a sha1'),
    tarball: z.string()
  })
})

export type RegistryMeta = z.infer<typeof registryMetaSchema>

/**
 * Fetch and validate the published metadata for `pkg@version`. `fetchFn` is
 * injectable for tests. A 404 means the version was never published; any other
 * non-OK status is surfaced verbatim.
 */
export async function fetchRegistryMeta(
  pkg: string,
  version: string,
  fetchFn: typeof fetch = fetch
): Promise<RegistryMeta> {
  const res = await fetchFn(`${REGISTRY}/${pkg}/${version}`)
  if (res.status === 404) {
    throw new Error(
      `${pkg}@${version} is not published on the public registry (404).`
    )
  }
  if (!res.ok) {
    throw new Error(
      `registry returned ${res.status} ${res.statusText} for ${pkg}@${version}.`
    )
  }
  return registryMetaSchema.parse(await res.json())
}

// --- gitHead cross-check ----------------------------------------------------
// npm records the publishing commit as `gitHead`. Asserting it equals the tag's
// commit catches a tag that points somewhere other than what was published. It
// is best-effort: older publishes may omit gitHead, in which case we warn and
// reproduce anyway (the digest match is the real proof).

export type GitHeadCheck =
  | { kind: 'ok' }
  | { kind: 'absent' }
  | { kind: 'mismatch'; gitHead: string; tagCommit: string }

export function checkGitHead(
  gitHead: string | undefined,
  tagCommit: string
): GitHeadCheck {
  if (!gitHead) return { kind: 'absent' }
  return gitHead === tagCommit
    ? { kind: 'ok' }
    : { kind: 'mismatch', gitHead, tagCommit }
}

/** The host-computed reproduction set against the expected (published) digests. */
export type DigestComparison = {
  reproduced: Reproduction
  expected: Digests
}

export type Outcome =
  | ({ kind: 'match' } & DigestComparison)
  | ({ kind: 'mismatch' } & DigestComparison)
  | { kind: 'toolchain-mismatch'; want: Toolchain; got: Toolchain }

/**
 * Reproduce `pkg@version` from `ref` in the sandbox and decide whether the
 * reproduction matches the expected digests. Pure decision logic over the
 * injected `Verifier`; never reads argv, never exits, never prints.
 */
export async function verifyReproducibility(
  input: VerifyInput,
  verifier: Verifier
): Promise<Outcome> {
  const pins = verifier.readToolchainPins(input.ref)
  verifier.buildImage(pins)
  const got = verifier.readSandboxToolchain()
  if (
    got.node !== pins.node ||
    got.npm !== pins.npm ||
    got.pnpm !== pins.pnpm
  ) {
    return { kind: 'toolchain-mismatch', want: pins, got }
  }
  const reproduced = await verifier.reproduce({
    ref: input.ref,
    pkg: input.pkg,
    version: input.version
  })
  // integrity (sha512) is the cryptographic anchor and must match: sha1 is
  // collision-broken, so it can't be the gate. A crafted tarball with a
  // matching sha1 but divergent content still fails here, because its sha512
  // differs. shasum is kept only as a cheap corroborating cross-check; both
  // digests derive from the same bytes, so an honest reproduction agrees on both.
  const intOk = reproduced.integrity === input.integrity
  const shaOk = reproduced.shasum === input.shasum
  const expected = { integrity: input.integrity, shasum: input.shasum }
  return intOk && shaOk
    ? { kind: 'match', reproduced, expected }
    : { kind: 'mismatch', reproduced, expected }
}

// --- verdict mapping --------------------------------------------------------
// Map an `Outcome` to a process exit code + plain-text verdict. Both CLIs share
// this so PASS/FAIL means the same thing and exits consistently; colour is
// applied at print time, not here.

export type Verdict = {
  code: number // process exit code: 0 PASS, 1 FAIL
  ok: boolean
  summary: string // one-line headline
  details: string[] // supporting lines (digest / pin comparison)
}

/** Reproduced-vs-published digests, side by side — shown on PASS and FAIL alike
 *  so the match (or divergence) is visually checkable, like run1 used to print. */
function digestLines(c: DigestComparison): string[] {
  return [
    `  reproduced integrity : ${c.reproduced.integrity}`,
    `  published  integrity : ${c.expected.integrity}`,
    `  reproduced shasum    : ${c.reproduced.shasum}`,
    `  published  shasum    : ${c.expected.shasum}`
  ]
}

export function verdictFor(
  outcome: Outcome,
  ctx: { pkg: string; version: string; ref: string }
): Verdict {
  const subject = `${ctx.pkg}@${ctx.version}`
  switch (outcome.kind) {
    case 'match':
      return {
        code: 0,
        ok: true,
        summary: `PASS — ${subject} reproduces from ${ctx.ref}`,
        details: digestLines(outcome)
      }
    case 'mismatch':
      return {
        code: 1,
        ok: false,
        summary: `FAIL — ${subject} is NOT reproducible from ${ctx.ref}`,
        details: digestLines(outcome)
      }
    case 'toolchain-mismatch':
      // Exit 2 (could-not-complete), NOT 1: a sandbox whose toolchain doesn't
      // match the pins is a broken-environment/wiring bug, not a verdict that
      // the published bytes were tampered with.
      return {
        code: 2,
        ok: false,
        summary: `FAIL — sandbox toolchain does not match the pins for ${ctx.ref}`,
        details: (['node', 'npm', 'pnpm'] as const).map(
          tool =>
            `  ${tool}: image has ${outcome.got[tool]}, expected ${outcome.want[tool]}`
        )
      }
  }
}

// --- production Verifier (I/O shell, untested by design) ---------------------
// Everything below shells out to docker + git + fs. It is deliberately kept
// behind the `Verifier` port so the decision logic above never sees a process.

/** The canonical sandbox image tag built + run by the verifier. */
export const VERIFY_IMAGE = 'nuqs-verify-release:latest'

export type DockerVerifierConfig = {
  scriptDir: string // directory holding the Dockerfile + run scripts
  repoRoot: string
  outDir: string // host mount target for the reproduced tarball
  image?: string
  wantColor?: boolean
  log?: (line: string) => void
}

/** Run a command to completion, capturing stdout; throws on a non-zero exit. */
function capture(cmd: string, args: string[], cwd?: string): string {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.error) throw r.error
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}\n${r.stderr}`)
  }
  return r.stdout
}

/**
 * Run `git archive <ref> | docker run … <cmd>`: the committed tree at `ref`
 * streams into the container's stdin (run1 reads it as its source). Resolves
 * with the container's exit code.
 */
function runArchiveContainer(
  image: string,
  flags: string[],
  cmd: string,
  repoRoot: string,
  ref: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const docker = spawn('docker', ['run', ...flags, image, cmd], {
      stdio: ['pipe', 'inherit', 'inherit']
    })
    docker.on('error', reject)
    docker.on('close', code => resolve(code ?? 1))
    const git = spawn('git', ['-C', repoRoot, 'archive', ref], {
      stdio: ['ignore', 'pipe', 'inherit']
    })
    git.on('error', reject)
    if (!git.stdout || !docker.stdin) {
      reject(new Error('failed to open the git-archive → container pipe'))
      return
    }
    git.stdout.pipe(docker.stdin)
  })
}

/**
 * The production `Verifier`: builds the canonical image, reproduces the package
 * in the hardened sandbox, and hashes the reproduced tarball on the host. The
 * sandbox only ever emits raw bytes; the host decides (in `verifyReproducibility`).
 */
export function makeDockerVerifier(config: DockerVerifierConfig): Verifier {
  const image = config.image ?? VERIFY_IMAGE
  const log =
    config.log ?? ((line: string) => void process.stderr.write(line + '\n'))

  return {
    readToolchainPins(ref) {
      // Read each pin file *at the ref* (symmetric with `git archive <ref>`), so
      // the build uses exactly the toolchain that commit shipped. A file missing
      // at the ref means the tag predates the reproducible-build pins — surface
      // that as the real limitation, not a raw `git show` exit 128.
      const at = (file: string) => {
        try {
          return capture('git', [
            '-C',
            config.repoRoot,
            'show',
            `${ref}:${file}`
          ])
        } catch (e) {
          // Only a *missing file at the ref* means "tag predates the pins";
          // rethrow anything else (corrupt repo, git not on PATH) verbatim.
          const msg = e instanceof Error ? e.message : String(e)
          if (/does not exist|exists on disk, but not in/.test(msg)) {
            throw new Error(
              `${ref} has no ${file}: this tag predates the reproducible-build toolchain pins and cannot be verified.`
            )
          }
          throw e
        }
      }
      return parseToolchain({
        nodeVersion: at('.node-version'),
        npmVersion: at('.npm-version'),
        packageJson: at('package.json')
      })
    },

    buildImage(pins) {
      log(
        `==> Building canonical image (node ${pins.node}, npm ${pins.npm}, pnpm ${pins.pnpm})`
      )
      const r = spawnSync(
        'docker',
        [
          'build',
          '-q',
          '--build-arg',
          `NODE_VERSION=${pins.node}`,
          '--build-arg',
          `NPM_VERSION=${pins.npm}`,
          '--build-arg',
          `PNPM_VERSION=${pins.pnpm}`,
          '-t',
          image,
          '.'
        ],
        { cwd: config.scriptDir, stdio: ['ignore', 'ignore', 'inherit'] }
      )
      if (r.status !== 0) {
        throw new Error(`docker build failed (exit ${r.status ?? 1})`)
      }
    },

    readSandboxToolchain() {
      const r = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--cap-drop',
          'ALL',
          '--security-opt',
          'no-new-privileges',
          image,
          'sh',
          '-c',
          'node --version; npm --version; pnpm --version'
        ],
        { encoding: 'utf8' }
      )
      if (r.status !== 0) {
        throw new Error(
          `could not query the sandbox toolchain (docker exit ${r.status})\n${r.stderr ?? ''}`
        )
      }
      const [node = '', npm = '', pnpm = ''] = r.stdout
        .trim()
        .split('\n')
        .map(s => s.trim().replace(/^v/, ''))
      return { node, npm, pnpm }
    },

    async reproduce({ ref, pkg, version }) {
      // Fresh out dir each run: clear stale artifacts, recreate the mount target.
      rmSync(config.outDir, { recursive: true, force: true })
      mkdirSync(config.outDir, { recursive: true })

      const flags = [
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
        `PACKAGE=${pkg}`,
        '-e',
        `VERSION=${version}`,
        ...(config.wantColor ? ['-e', 'FORCE_COLOR=1'] : []),
        '-v',
        `${config.outDir}:/out`
      ]

      log(`==> Reproducing ${pkg}@${version} from ${ref}`)
      const code = await runArchiveContainer(
        image,
        flags,
        'run1.reproduce.sh',
        config.repoRoot,
        ref
      )
      if (code !== 0) {
        const kind = code >= 125 ? 'docker/infrastructure' : 'build/tooling'
        throw new Error(`reproduction failed: ${kind} error (exit ${code})`)
      }

      // Host-side digests of the reproduced bytes: the host has the final word.
      const localTgz = join(config.outDir, 'local.tgz')
      const bytes = readFileSync(localTgz)
      return {
        integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
        shasum: createHash('sha1').update(bytes).digest('hex'),
        localTgz
      }
    }
  }
}
