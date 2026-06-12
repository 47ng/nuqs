#!/usr/bin/env bash
#
# Run 2 — content diff. Baked into the canonical image and run under a
# read-only rootfs as a non-root user. Reached ONLY after run 1 reports a hash
# mismatch, so its job is forensic: extract both tarballs and show exactly which
# files diverge. It never blesses anything — the release is already known-bad.
#
# Extraction is the one genuinely-dangerous step (path-traversal / zip-slip on
# the *untrusted* staged tarball), which is precisely why it happens here, in
# the sandbox (read-only rootfs, non-root, tmpfs scratch, all caps dropped),
# rather than on the host.
#
# Inputs (mount, ro):
#   /in/local.tgz   — our reproduction (from run 1)
#   /in/staged.tgz  — the staged tarball the host downloaded from the registry
# Inputs (env):
#   PACKAGE, VERSION — labels only
#
# Exit code: 21 — contents diverge (always; run 2 only runs on a known mismatch).
set -euo pipefail

: "${PACKAGE:?}" "${VERSION:?}"
for f in /in/local.tgz /in/staged.tgz; do
  [ -f "$f" ] || { echo "FAIL: missing ${f}" >&2; exit 2; }
done

# npm tarballs always root their payload at `package/`. Extract each into its
# own tmpfs dir; --no-same-owner/-permissions neutralises hostile metadata.
mkdir -p /tmp/local /tmp/staged
tar -xzf /in/local.tgz  -C /tmp/local  --no-same-owner --no-same-permissions
tar -xzf /in/staged.tgz -C /tmp/staged --no-same-owner --no-same-permissions
LROOT=/tmp/local/package
SROOT=/tmp/staged/package

( cd "${LROOT}" && find . -type f | sort ) >/tmp/local.list
( cd "${SROOT}" && find . -type f | sort ) >/tmp/staged.list

echo "=================================================================="
echo " CONTENT DIFF — ${PACKAGE}@${VERSION}   (staged vs local reproduction)"
echo "=================================================================="

# --- set diff: files present in only one side -------------------------------
ONLY_STAGED="$(comm -13 /tmp/local.list /tmp/staged.list)"
ONLY_LOCAL="$(comm -23 /tmp/local.list /tmp/staged.list)"
COMMON="$(comm -12 /tmp/local.list /tmp/staged.list)"

if [ -n "${ONLY_STAGED}" ]; then
  echo "--- only in STAGED (added/unexpected) ---"
  while IFS= read -r f; do echo "  + ${f}"; done <<<"${ONLY_STAGED}"
fi
if [ -n "${ONLY_LOCAL}" ]; then
  echo "--- only in LOCAL (missing from staged) ---"
  while IFS= read -r f; do echo "  - ${f}"; done <<<"${ONLY_LOCAL}"
fi

# --- per-file diff for common files that differ -----------------------------
is_text() { grep -Iq . "$1" 2>/dev/null; } # -I => binary counts as no-match

# Summarise a divergence by size + sha1 instead of dumping bytes. Used for
# binaries and for sourcemaps (single-line JSON blobs that are technically text
# but unreadable as a line diff — and a chunk-hash change rewrites the whole
# `mappings` string anyway, so a textual diff is pure noise).
size_sha_summary() { # $1 = staged path, $2 = local path
  printf '  staged: sha1 %s · %8s bytes\n' "$(sha1sum "$1" | cut -d' ' -f1)" "$(wc -c <"$1")"
  printf '   local: sha1 %s · %8s bytes\n' "$(sha1sum "$2" | cut -d' ' -f1)" "$(wc -c <"$2")"
}

DIFFERED=0
while IFS= read -r rel; do
  [ -n "${rel}" ] || continue
  l="${LROOT}/${rel}"; s="${SROOT}/${rel}"
  cmp -s "${l}" "${s}" && continue # identical
  DIFFERED=1
  echo "------------------------------------------------------------------"
  case "${rel}" in
    *.map)
      echo "SOURCEMAP DIFFERS: ${rel}"
      size_sha_summary "${s}" "${l}"
      ;;
    *)
      if is_text "${l}" && is_text "${s}"; then
        echo "TEXT DIFFERS: ${rel}  (staged vs local)"
        diff -u --label "staged/${rel}" "${s}" --label "local/${rel}" "${l}" || true
      else
        echo "BINARY DIFFERS: ${rel}"
        size_sha_summary "${s}" "${l}"
      fi
      ;;
  esac
done <<<"${COMMON}"

echo "=================================================================="
if [ "${DIFFERED}" = 0 ] && [ -z "${ONLY_STAGED}${ONLY_LOCAL}" ]; then
  echo "NOTE: every extracted file is byte-identical — the divergence is in the"
  echo "      gzip wrapper only (mtime/OS-byte/zlib). Investigate why the pinned"
  echo "      build environment failed to reproduce the wrapper byte-for-byte."
fi
echo "RESULT : FAIL — staged contents are NOT reproducible from HEAD. Do not approve."
exit 21
