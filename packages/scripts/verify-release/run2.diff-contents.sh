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

# --- colour ----------------------------------------------------------------
# Standard knobs: NO_COLOR wins, else FORCE_COLOR forces, else a stdout-TTY
# check. The sandbox has no TTY of its own, so verify.staged.ts sets
# FORCE_COLOR=1 when ITS stdout is an interactive terminal. diff_opts carries
# --color=always only when on, so `diff -u` highlights +/- lines too.
use_color=0
if [ -n "${NO_COLOR:-}" ]; then
  use_color=0
elif [ -n "${FORCE_COLOR:-}" ] && [ "${FORCE_COLOR}" != 0 ] && [ "${FORCE_COLOR}" != false ]; then
  use_color=1
elif [ -t 1 ]; then
  use_color=1
fi
diff_opts=(-u)
if [ "${use_color}" = 1 ]; then
  c_reset=$'\e[0m'; c_bold=$'\e[1m'
  c_red=$'\e[31m'; c_green=$'\e[32m'; c_yellow=$'\e[33m'
  diff_opts+=(--color=always)
else
  c_reset=''; c_bold=''; c_red=''; c_green=''; c_yellow=''
fi

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
  echo "${c_yellow}--- only in STAGED (added/unexpected) ---${c_reset}"
  while IFS= read -r f; do echo "${c_green}  + ${f}${c_reset}"; done <<<"${ONLY_STAGED}"
fi
if [ -n "${ONLY_LOCAL}" ]; then
  echo "${c_yellow}--- only in LOCAL (missing from staged) ---${c_reset}"
  while IFS= read -r f; do echo "${c_red}  - ${f}${c_reset}"; done <<<"${ONLY_LOCAL}"
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
      echo "${c_bold}${c_yellow}SOURCEMAP DIFFERS:${c_reset} ${rel}"
      size_sha_summary "${s}" "${l}"
      ;;
    *)
      if is_text "${l}" && is_text "${s}"; then
        echo "${c_bold}${c_yellow}TEXT DIFFERS:${c_reset} ${rel}  (staged vs local)"
        diff "${diff_opts[@]}" --label "staged/${rel}" "${s}" --label "local/${rel}" "${l}" || true
      else
        echo "${c_bold}${c_yellow}BINARY DIFFERS:${c_reset} ${rel}"
        size_sha_summary "${s}" "${l}"
      fi
      ;;
  esac
done <<<"${COMMON}"

echo "=================================================================="
if [ "${DIFFERED}" = 0 ] && [ -z "${ONLY_STAGED}${ONLY_LOCAL}" ]; then
  echo "${c_yellow}NOTE: every extracted file is byte-identical — the divergence is in the${c_reset}"
  echo "${c_yellow}      gzip wrapper only (mtime/OS-byte/zlib). Investigate why the pinned${c_reset}"
  echo "${c_yellow}      build environment failed to reproduce the wrapper byte-for-byte.${c_reset}"
fi
echo "${c_bold}${c_red}RESULT : FAIL — staged contents are NOT reproducible from HEAD. Do not approve.${c_reset}"
exit 21
