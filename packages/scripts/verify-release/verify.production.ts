#!/usr/bin/env -S node --no-warnings
//
// Production-release verification — host launcher.
//
// Usage:
//   pnpm verify <tag>          (e.g. pnpm verify v2.8.9)
//   verify.production.ts <tag>
//
// Reproduces a *published* nuqs release from its git tag in the hardened
// sandbox and matches the reproduction against the public npm registry — out of
// band, no staging credentials. Anyone can run it to confirm the bytes on
// npmjs.com are the bytes the tagged source produces.
//
// Flow:
//   1. Fetch the tag and resolve it to a commit.
//   2. Read the published metadata straight from registry.npmjs.org
//      (integrity, shasum, gitHead) — unauthenticated.
//   3. Cross-check the registry's gitHead against the tag's commit.
//   4. Reproduce from the tag's source and match the host-computed digests.
//
// Runs on Node.js directly via native type-stripping — no build step.

import { spawnSync } from 'node:child_process'
import { parseArgs, styleText } from 'node:util'
import {
  checkGitHead,
  fetchRegistryMeta,
  makeDockerVerifier,
  normalizeTag,
  verdictFor,
  verifyReproducibility
} from './verify.lib.ts'

// nuqs is the only publishable package in the monorepo; every vX.Y.Z tag maps
// to it. There is therefore no package argument to disambiguate.
const PACKAGE = 'nuqs'

const HELP = `Production-release verification — reproduce a published nuqs
release from its git tag and match it against the public npm registry.

Usage:
  pnpm verify <tag>            e.g. pnpm verify v2.8.9
  verify.production.ts <tag>

The tag may be given with or without the leading 'v' (v2.8.9 or 2.8.9).
No npm credentials are required: the release metadata is read directly from
registry.npmjs.org. Exit 0 = reproducible, 1 = NOT reproducible, 2 = could
not complete (bad tag, network, or sandbox error).
`

const SCRIPT_DIR = import.meta.dirname
const TARBALLS_DIR = `${SCRIPT_DIR}/tarballs`

const err = (msg = ''): void => void process.stderr.write(msg + '\n')

function die(code: number, ...lines: string[]): never {
  for (const line of lines) err(line)
  process.exit(code)
}

/** Run a command to completion, capturing stdout; throws on non-zero exit. */
function capture(cmd: string, args: string[]): string {
  const r = spawnSync(cmd, args, { encoding: 'utf8' })
  if (r.error) throw r.error
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}\n${r.stderr}`)
  }
  return r.stdout
}

// --- args -------------------------------------------------------------------
const { values, positionals } = (() => {
  try {
    return parseArgs({
      options: { help: { type: 'boolean', short: 'h', default: false } },
      allowPositionals: true
    })
  } catch (e) {
    return die(2, (e as Error).message, '', HELP)
  }
})()

if (values.help) {
  console.log(HELP)
  process.exit(0)
}
if (positionals.length !== 1) {
  die(2, 'Expected exactly one <tag> argument.', '', HELP)
}

const { tag: TAG, version: VERSION } = (() => {
  try {
    return normalizeTag(positionals[0]!)
  } catch (e) {
    return die(2, styleText('red', `==> ${(e as Error).message}`))
  }
})()

const REPO_ROOT = capture('git', ['rev-parse', '--show-toplevel']).trim()

// 1. Fetch the tag (tolerate offline / already-present), then resolve it to a
//    commit. `git archive <tag>` later ships exactly this commit's tree.
err(`==> Fetching tag ${TAG}`)
try {
  capture('git', ['-C', REPO_ROOT, 'fetch', 'origin', 'tag', TAG, '--no-tags'])
} catch {
  err(
    styleText(
      'yellow',
      `WARN: could not fetch ${TAG} from origin — using the local copy if present.`
    )
  )
}
const tagCommit = (() => {
  try {
    return capture('git', [
      '-C',
      REPO_ROOT,
      'rev-parse',
      `${TAG}^{commit}`
    ]).trim()
  } catch {
    return die(
      2,
      styleText(
        'red',
        `==> tag ${TAG} not found (fetch failed and it is not present locally).`
      )
    )
  }
})()

// 2. Published metadata, straight from the canonical public registry.
err(`==> Reading published metadata for ${PACKAGE}@${VERSION}`)
const meta = await fetchRegistryMeta(PACKAGE, VERSION).catch((e: Error) =>
  die(2, styleText('red', `==> ${e.message}`))
)
err(`    integrity : ${meta.dist.integrity}`)
err(`    shasum    : ${meta.dist.shasum}`)
err(`    gitHead   : ${meta.gitHead ?? '<not recorded>'}`)
err(`    tag commit: ${tagCommit}`)

// 3. Cross-check the registry's gitHead against the tag's commit.
const gitHeadCheck = checkGitHead(meta.gitHead, tagCommit)
if (gitHeadCheck.kind === 'mismatch') {
  die(
    1,
    styleText(
      'red',
      `==> FAIL — the published gitHead does not match ${TAG}:
  gitHead   ${gitHeadCheck.gitHead}
  ${TAG}    ${gitHeadCheck.tagCommit}
  The tag points elsewhere than what was published. Do not trust this release.`
    )
  )
}
if (gitHeadCheck.kind === 'absent') {
  err(
    styleText(
      'yellow',
      '    note: registry has no gitHead — skipping the commit cross-check.'
    )
  )
}

// 4. Reproduce from the tag's source and match the host-computed digests.
const wantColor =
  !('NO_COLOR' in process.env) &&
  (process.env.FORCE_COLOR
    ? process.env.FORCE_COLOR !== '0'
    : process.stdout.isTTY === true)

const verifier = makeDockerVerifier({
  scriptDir: SCRIPT_DIR,
  repoRoot: REPO_ROOT,
  outDir: TARBALLS_DIR,
  wantColor
})

const outcome = await verifyReproducibility(
  {
    ref: TAG,
    pkg: PACKAGE,
    version: VERSION,
    integrity: meta.dist.integrity,
    shasum: meta.dist.shasum
  },
  verifier
).catch((e: Error) =>
  die(2, styleText('red', `==> could not complete reproduction: ${e.message}`))
)

const verdict = verdictFor(outcome, {
  pkg: PACKAGE,
  version: VERSION,
  ref: TAG
})
for (const line of verdict.details) err(line)
err('')
err(styleText(verdict.ok ? 'green' : 'red', `==> ${verdict.summary}`))
process.exit(verdict.code)
