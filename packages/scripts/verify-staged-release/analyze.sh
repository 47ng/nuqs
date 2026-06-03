#!/usr/bin/env bash
#
# In-container analysis for staged-release verification. Baked into the
# canonical image (NOT taken from the untrusted source archive) and run under
# a read-only rootfs, so a malicious build cannot rewrite this logic.
#
# Reads the clean committed source tree as a tar stream on stdin, reproduces
# `npm pack`, and runs the escalating digest cascade. The logs ARE the verdict
# — the raw digests are printed next to PASS/FAIL so a human confirms the
# actual hash equality; the RESULT line is convenience.
#
# Inputs (env):
#   PACKAGE          package dir/name under packages/ (e.g. nuqs)
#   VERSION          version to set before packing (from the run-summary block)
#   EXPECTED_SHASUM  staged .tgz sha1 (block.shasum) — rung 1 target
#   MODE             rung1 | escalate
#   STAGE_ID         (escalate) npm stage id to download/enumerate
#   NPM_TOKEN        (escalate) read-only granular token, injected via env
#
# Exit codes: 0 PASS · 20 rung-1 mismatch (re-run --escalate) · 21 FAIL
# (not reproducible) · 1/2 environment/tooling error.
set -euo pipefail

: "${PACKAGE:?}" "${VERSION:?}" "${EXPECTED_SHASUM:?}" "${MODE:?}"

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

echo "=================================================================="
echo " package           : ${PACKAGE}@${VERSION}"
echo " reproduced .tgz    : $(basename "${REPRO_TGZ_PATH}")"
echo " reproduced sha1    : ${REPRO_TGZ_SHA}"
echo " staged shasum      : ${EXPECTED_SHASUM}"
echo " reproduced integ.  : ${REPRO_INTEGRITY}"
echo " staged integrity   : ${EXPECTED_INTEGRITY:-<not provided>}"
echo "=================================================================="

# --- Rung 1: pure metadata (token-free) -------------------------------------
# Assert sha1 == staged shasum AND (when provided) sha512 == staged integrity.
# Gating on the sha512 too closes the sha1-collision gap a blob attacker would
# otherwise target.
SHA_OK=0; INT_OK=1
[ "${REPRO_TGZ_SHA}" = "${EXPECTED_SHASUM}" ] && SHA_OK=1
if [ -n "${EXPECTED_INTEGRITY:-}" ]; then
  INT_OK=0
  [ "${REPRO_INTEGRITY}" = "${EXPECTED_INTEGRITY}" ] && INT_OK=1
fi
if [ "${SHA_OK}" = 1 ] && [ "${INT_OK}" = 1 ]; then
  if [ -n "${EXPECTED_INTEGRITY:-}" ]; then
    echo "RUNG 1 (metadata) : PASS — reproduced .tgz == staged shasum + integrity"
  else
    echo "RUNG 1 (metadata) : PASS — reproduced .tgz == staged shasum (no integrity in block)"
  fi
  echo "RESULT            : PASS"
  exit 0
fi
echo "RUNG 1 (metadata) : FAIL — sha1 match=${SHA_OK}, sha512 match=${INT_OK}"

if [ "${MODE}" != "escalate" ]; then
  echo "RESULT            : FAIL (rung 1)."
  echo "                    Re-run with --escalate to download the staged tarball"
  echo "                    and diagnose (gzip drift vs real divergence). That mints"
  echo "                    a short-lived read-only npm token."
  exit 20
fi

# --- Escalation: registry-backed rungs + enumeration ------------------------
: "${STAGE_ID:?}" "${NPM_TOKEN:?}"
export npm_config_userconfig=/tmp/.npmrc
umask 077
printf '//registry.npmjs.org/:_authToken=%s\n' "${NPM_TOKEN}" >/tmp/.npmrc

enumerate() { # version-aware staged-list sweep (Scenario A)
  echo "------------------------------------------------------------------"
  echo "Staged entries for ${PACKAGE}:"
  local json
  if ! json="$(npm stage list "${PACKAGE}" --json 2>/tmp/list.log)"; then
    cat /tmp/list.log >&2; echo "  (could not list staged entries)"; return
  fi
  REPRO_SHA="${REPRO_TGZ_SHA}" THIS_VER="${VERSION}" jq -r '
    .[] | [
      .version, .tag, .actor, .createdAt, .shasum,
      ( if .shasum == env.REPRO_SHA then "<= MATCHES your reproduction"
        elif .version == env.THIS_VER then "!! SAME VERSION, shasum you CANNOT reproduce — squat? reject+investigate"
        else "(other version — informational)" end )
    ] | "  " + (.[0]) + "  " + (.[1]) + "  by " + (.[2]) + "  " + (.[3]) + "\n    shasum " + (.[4]) + "  " + (.[5])
  ' <<<"${json}"
  echo "------------------------------------------------------------------"
}

echo "Downloading staged tarball (stage ${STAGE_ID})..."
mkdir -p /tmp/staged && cd /tmp/staged
run /tmp/download.log npm stage download "${STAGE_ID}"
STAGED_TGZ="$(ls -1t ./*.tgz | head -1)"
STAGED_BLOB_SHA="$(sha1sum "${STAGED_TGZ}" | cut -d' ' -f1)"
echo " downloaded blob sha1 : ${STAGED_BLOB_SHA}"
if [ "${STAGED_BLOB_SHA}" != "${EXPECTED_SHASUM}" ]; then
  echo " WARNING: downloaded blob sha1 != reported staged shasum"
  echo "          (registry metadata inconsistency / possible lying)"
fi

# --- Rung 2: opaque blob vs reproduction ------------------------------------
if [ "${REPRO_TGZ_SHA}" = "${STAGED_BLOB_SHA}" ]; then
  echo "RUNG 2 (blob)     : PASS — reproduced .tgz == downloaded staged blob"
  echo "RESULT            : PASS (rung 2)"
  enumerate
  exit 0
fi
echo "RUNG 2 (blob)     : FAIL — reproduced .tgz != downloaded staged blob"

# --- Rung 3: inner tar (gunzip only, NEVER untar) ---------------------------
REPRO_INNER="$(gunzip -c "${REPRO_TGZ_PATH}" | sha1sum | cut -d' ' -f1)"
STAGED_INNER="$(gunzip -c "/tmp/staged/${STAGED_TGZ#./}" | sha1sum | cut -d' ' -f1)"
echo " reproduced inner-tar sha1 : ${REPRO_INNER}"
echo " staged     inner-tar sha1 : ${STAGED_INNER}"
if [ "${REPRO_INNER}" = "${STAGED_INNER}" ]; then
  echo "RUNG 3 (inner-tar): PASS — contents identical; only the gzip wrapper"
  echo "                    differs (benign environment drift)"
  echo "RESULT            : PASS (rung 3)"
  enumerate
  exit 0
fi

echo "RUNG 3 (inner-tar): FAIL — contents differ"
echo "RESULT            : FAIL — staged bytes are NOT reproducible from HEAD."
echo "                    DO NOT APPROVE. Reject the stage and investigate."
enumerate
exit 21
