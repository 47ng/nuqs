#!/usr/bin/env node
// Gate: ensure no console.*, debug(), or performance.mark call site has been removed
// from packages/nuqs/src compared to the baseline experiment (exp_0000).
//
// Usage: node evo-bench/guard-call-sites.mjs <worktree>
//
// These call sites are functionality (user-visible diagnostics + timing). Tests do
// NOT cover them, so without this gate agents can silently strip them for byte
// savings. See .evo/project.md hard constraint #5 for context.

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const worktree = resolve(process.argv[2] ?? process.cwd())
const baselineRef = process.env.EVO_GUARD_BASELINE_REF || 'evo/run_0000/exp_0000'
const targetGlob = 'packages/nuqs/src'

const diff = spawnSync(
  'git',
  ['-C', worktree, 'diff', baselineRef, 'HEAD', '--', targetGlob],
  { encoding: 'utf-8' }
)
if (diff.status !== 0) {
  console.error('[guard] git diff failed:', diff.stderr)
  process.exit(1)
}

const removed = diff.stdout
  .split('\n')
  .filter(l => l.startsWith('-') && !l.startsWith('---'))
  .filter(l => /\b(debug\(|console\.(log|warn|error|info|debug)|performance\.mark)\b/.test(l))

if (removed.length > 0) {
  console.error(
    `[guard] FAIL: ${removed.length} call site(s) removed vs baseline (${baselineRef}).\n` +
      `These are functionality per .evo/project.md hard constraint #5. Restore them.\n\n` +
      removed.slice(0, 40).map(l => '  ' + l).join('\n') +
      (removed.length > 40 ? `\n  ... ${removed.length - 40} more` : '')
  )
  process.exit(1)
}

console.error(`[guard] OK: no debug()/console.*/performance.mark call sites removed vs ${baselineRef}`)
