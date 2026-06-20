#!/usr/bin/env bash
# Locally reproduce the repro-1293 regression on the Next.js
# `cacheComponents: true` + `react-compiler: true` CI variant.
#
# Mirrors `.github/workflows/ci-cd.yml` (e2e-next matrix `include` with
# cache-components + react-compiler) step-for-step, so a failure here is the
# same failure CI reports for that variant.
#
# THE UNLOCK vs naive local runs: CI=true.
# Without it, playwright's `reuseExistingServer: !process.env.CI` reuses a stale
# dev/start server on :3001 -> wholesale URL/navigation failures (~485/515) that
# look like "the repro is broken locally". CI=true also matches CI's
# workers=3 / retries=2. Reproduces with the pinned catalog Next — no
# `next@latest` install needed.
#
# Usage:  packages/e2e/next/scripts/repro-1293-cachecomponents.sh
# Always reverts the two files the codemod mutates on exit.
set -euo pipefail

NEXT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(git -C "$NEXT_DIR" rev-parse --show-toplevel)"
F1="$NEXT_DIR/src/app/app/(shared)/render-count/[hook]/[shallow]/[history]/[startTransition]/page.tsx"
F2="$NEXT_DIR/src/app/api/app/loader/route.ts"

cleanup() {
  # Revert the two files the codemod comments out, regardless of outcome.
  git -C "$REPO_ROOT" checkout -- "$F1" "$F2" 2>/dev/null || true
}
trap cleanup EXIT

# 1. cacheComponents codemod: comment out `export const dynamic` (2 tracked files).
node "$NEXT_DIR/scripts/cache-components-codemod.ts"

# 2. Build (next build) + test (playwright) via turbo, with the exact CI env.
#    --force + a fresh E2E_NO_CACHE_ON_RERUN bypass the turbo cache so the build
#    is genuinely produced with these flags rather than restored from cache.
cd "$REPO_ROOT"
CI=true \
BASE_PATH=/ \
REACT_COMPILER=true \
CACHE_COMPONENTS=true \
E2E_NO_CACHE_ON_RERUN="repro-$(date +%s)" \
  pnpm run test --filter e2e-next --force
