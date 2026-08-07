#!/usr/bin/env bash
#
# Run 1 — reproduce the build and emit the tarball. Baked into the canonical
# image (NOT taken from the untrusted source archive) and run under a read-only
# rootfs, so a malicious build cannot rewrite this logic.
#
# Reads the clean committed source tree as a tar stream on stdin, reproduces
# `npm pack`, and copies the reproduction to the host via the /out mount. It
# does NOT decide anything: the host hashes the emitted bytes and compares them
# against the expected digests (see verify.lib.ts `verifyReproducibility`). This
# keeps the verdict on the trusted host, out of reach of the build it ran.
#
# Inputs (env):
#   PACKAGE          package dir/name under packages/ (e.g. nuqs)
#   VERSION          version to set before packing
# Inputs (stdin):    `git archive <ref>` of the clean committed tree
# Outputs (mount):   /out/local.tgz  — the reproduced tarball, for the host
#
# Exit codes: 0 reproduced · 1/2 tooling error.
set -euo pipefail

: "${PACKAGE:?}" "${VERSION:?}"

run() { # run a noisy step, surface its log only on failure
  local log="$1"; shift
  "$@" >"$log" 2>&1 || { cat "$log" >&2; return 1; }
}

# 1. Clean committed source from stdin (no .git, no host mounts).
mkdir -p /tmp/src
tar -x -C /tmp/src
cd /tmp/src

# 2. Reproduce the build. Single --ignore-scripts install (matches CI; never
#    runs workspace lifecycle scripts in the sandbox).
run /tmp/install.log pnpm install --frozen-lockfile --ignore-scripts --filter "${PACKAGE}..."
( cd "packages/${PACKAGE}" && npm pkg set version="${VERSION}" )
run /tmp/build.log pnpm build --filter "${PACKAGE}"

PKG_DIR="/tmp/src/packages/${PACKAGE}"
cd "${PKG_DIR}"
run /tmp/pack.log npm pack
REPRO_TGZ="$(ls -1t ./*.tgz | head -1)"
REPRO_TGZ_PATH="${PKG_DIR}/${REPRO_TGZ#./}"

# 3. Hand the reproduction back to the host (the only writable mount). The host
#    computes the sha1/sha512 and decides; we only report what we packed.
cp "${REPRO_TGZ_PATH}" /out/local.tgz

echo "=================================================================="
echo " package         : ${PACKAGE}@${VERSION}"
echo " reproduced .tgz : $(basename "${REPRO_TGZ_PATH}")"
echo "=================================================================="
