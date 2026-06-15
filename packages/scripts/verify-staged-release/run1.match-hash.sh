#!/usr/bin/env bash
#
# Run 1 — reproduce the staged build and match its hash. Baked into the
# canonical image (NOT taken from the untrusted source archive) and run under a
# read-only rootfs, so a malicious build cannot rewrite this verdict logic.
#
# Reads the clean committed source tree as a tar stream on stdin, reproduces
# `npm pack`, copies the reproduction to the host via the /out mount, and
# asserts its digests against the staged values from the run-summary fields.
#
# Inputs (env):
#   PACKAGE          package dir/name under packages/ (e.g. nuqs)
#   VERSION          version to set before packing (from --version)
#   EXPECTED_SHASUM  staged .tgz sha1 (from --shasum)
#   EXPECTED_INTEGRITY  staged .tgz sha512 integrity (from --integrity, optional)
# Inputs (stdin):    `git archive HEAD` of the clean committed tree
# Outputs (mount):   /out/local.tgz  — the reproduced tarball, for run 2
#
# Exit codes: 0 PASS · 20 hash mismatch (host escalates) · 1/2 tooling error.
set -euo pipefail

: "${PACKAGE:?}" "${VERSION:?}" "${EXPECTED_SHASUM:?}"

# --- colour ----------------------------------------------------------------
# Standard knobs: NO_COLOR wins, else FORCE_COLOR forces, else fall back to a
# stdout-TTY check. The sandbox has no TTY of its own (the host runs `docker
# run` without -t to keep run 1's binary git-archive stdin clean), so verify.ts
# sets FORCE_COLOR=1 when ITS stdout is an interactive terminal — making this
# script behave correctly both inside the sandbox and if run directly.
use_color=0
if [ -n "${NO_COLOR:-}" ]; then
  use_color=0
elif [ -n "${FORCE_COLOR:-}" ] && [ "${FORCE_COLOR}" != 0 ] && [ "${FORCE_COLOR}" != false ]; then
  use_color=1
elif [ -t 1 ]; then
  use_color=1
fi
if [ "${use_color}" = 1 ]; then
  c_reset=$'\e[0m'; c_bold=$'\e[1m'; c_dim=$'\e[2m'
  c_red=$'\e[31m'; c_green=$'\e[32m'
else
  c_reset=''; c_bold=''; c_dim=''; c_red=''; c_green=''
fi

run() { # run a noisy step, surface its log only on failure
  local log="$1"; shift
  "$@" >"$log" 2>&1 || { cat "$log" >&2; return 1; }
}

# 1. Clean committed source from stdin (no .git, no host mounts).
mkdir -p /tmp/src
tar -x -C /tmp/src
cd /tmp/src

# 2. Reproduce the staged build. Single --ignore-scripts install (matches CI;
#    never runs workspace lifecycle scripts in the sandbox).
run /tmp/install.log pnpm install --frozen-lockfile --ignore-scripts --filter "${PACKAGE}..."
( cd "packages/${PACKAGE}" && npm pkg set version="${VERSION}" )
run /tmp/build.log pnpm build --filter "${PACKAGE}"

PKG_DIR="/tmp/src/packages/${PACKAGE}"
cd "${PKG_DIR}"
run /tmp/pack.log npm pack
REPRO_TGZ="$(ls -1t ./*.tgz | head -1)"
REPRO_TGZ_PATH="${PKG_DIR}/${REPRO_TGZ#./}"
REPRO_TGZ_SHA="$(sha1sum "${REPRO_TGZ_PATH}" | cut -d' ' -f1)"
# npm's `integrity` is sha512 of the .tgz, base64, prefixed `sha512-`.
REPRO_INTEGRITY="sha512-$(openssl dgst -sha512 -binary "${REPRO_TGZ_PATH}" | openssl base64 -A)"

# 3. Hand the reproduction back to the host (run 2 diffs it against the
#    downloaded staged tarball). /out is the only writable host mount.
cp "${REPRO_TGZ_PATH}" /out/local.tgz

echo "=================================================================="
echo " package             : ${PACKAGE}@${VERSION}"
echo " reproduced .tgz     : $(basename "${REPRO_TGZ_PATH}")"
echo " reproduced sha1     : ${REPRO_TGZ_SHA}"
echo " staged shasum       : ${EXPECTED_SHASUM}"
echo " reproduced integ.   : ${REPRO_INTEGRITY}"
echo " staged integrity    : ${EXPECTED_INTEGRITY:-<not provided>}"
echo "=================================================================="

# 4. Match: sha1 == staged shasum AND (when provided) sha512 == staged
#    integrity. Gating on the sha512 too closes the sha1-collision gap a blob
#    attacker would otherwise target.
SHA_OK=0; INT_OK=1
[ "${REPRO_TGZ_SHA}" = "${EXPECTED_SHASUM}" ] && SHA_OK=1
if [ -n "${EXPECTED_INTEGRITY:-}" ]; then
  INT_OK=0
  [ "${REPRO_INTEGRITY}" = "${EXPECTED_INTEGRITY}" ] && INT_OK=1
fi
if [ "${SHA_OK}" = 1 ] && [ "${INT_OK}" = 1 ]; then
  if [ -n "${EXPECTED_INTEGRITY:-}" ]; then
    echo "${c_green}HASH MATCH : PASS — reproduced .tgz == staged shasum + integrity${c_reset}"
  else
    echo "${c_green}HASH MATCH : PASS — reproduced .tgz == staged shasum (no --integrity given)${c_reset}"
  fi
  echo "${c_bold}${c_green}RESULT     : PASS${c_reset}"
  exit 0
fi

echo "${c_red}HASH MATCH : FAIL — sha1 match=${SHA_OK}, sha512 match=${INT_OK}${c_reset}"
echo "${c_bold}${c_red}RESULT     : FAIL — reproduced .tgz != staged digests.${c_reset}"
echo "${c_dim}             Host will download the staged tarball and diff its contents.${c_reset}"
exit 20
