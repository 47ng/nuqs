#!/usr/bin/env bash
#
# Staged-release verification — host launcher.
#
# Usage:
#   verify.sh [block-file]              # rung 1 only, token-free
#   verify.sh --escalate [block-file]   # rungs 1-3 + staged-list enumeration
#                                        # (mints a short-lived read-only token)
#
# With no block-file, paste the run-summary key=value block on stdin (Ctrl-D).
#
# The launcher stays a portable, dependency-free bash script (no jq/node):
# it parses only what it needs (the SHA, for the clean-tree guard) with plain
# shell, ships the clean committed tree into the sandbox via `git archive`, and
# lets the in-container analysis (baked into the image) do the rest.
set -euo pipefail
cd "$(dirname "$0")"
REPO_ROOT="$(git rev-parse --show-toplevel)"
IMAGE="nuqs-verify-staged:latest"
REGISTRY="//registry.npmjs.org/"

# --- args -------------------------------------------------------------------
ESCALATE=0
BLOCK_FILE=""
for arg in "$@"; do
  case "$arg" in
    --escalate|--enumerate|--paranoid) ESCALATE=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    -*) echo "unknown flag: $arg" >&2; exit 2 ;;
    *) BLOCK_FILE="$arg" ;;
  esac
done

# --- read + parse the run-summary block -------------------------------------
if [ -n "$BLOCK_FILE" ]; then
  RAW="$(cat "$BLOCK_FILE")"
else
  echo "Paste the run-summary block, then Ctrl-D:" >&2
  RAW="$(cat)"
fi
# Keep only key=value lines (tolerate pasted ``` fences and stray prose).
BLOCK="$(printf '%s\n' "$RAW" | grep -E '^[a-z_]+=' || true)"
field() { printf '%s\n' "$BLOCK" | grep -E "^$1=" | head -1 | cut -d= -f2-; }

PACKAGE="$(field package)"
VERSION="$(field version)"
SHA="$(field sha)"
DIST_TAG="$(field dist_tag)"
STAGE_ID="$(field stage_id)"
SHASUM="$(field shasum)"
INTEGRITY="$(field integrity)"
: "${PACKAGE:?block missing 'package='}" \
  "${VERSION:?block missing 'version='}" \
  "${SHA:?block missing 'sha='}" \
  "${SHASUM:?block missing 'shasum='}"

# --- clean-tree guard: HEAD must BE the staged commit -----------------------
if ! git -C "$REPO_ROOT" diff --quiet HEAD 2>/dev/null; then
  echo "FAIL: working tree is dirty — commit or stash so HEAD is exactly the" >&2
  echo "      staged commit before verifying." >&2
  exit 1
fi
HEAD_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
if [ "$HEAD_SHA" != "$SHA" ]; then
  echo "FAIL: HEAD ($HEAD_SHA)" >&2
  echo "      != block sha ($SHA)." >&2
  echo "      Check out the staged commit, then re-run." >&2
  exit 1
fi

echo "==> Building canonical image" >&2
docker build -q -t "$IMAGE" . >/dev/null

# --- hardened sandbox flags -------------------------------------------------
DOCKER_FLAGS=(
  --rm -i
  --read-only
  --tmpfs /tmp:exec,mode=1777
  --tmpfs /home/verifier:exec,mode=1777
  --cap-drop ALL
  --security-opt no-new-privileges
  --memory 6g --cpus 4 --pids-limit 2048
  -e PACKAGE="$PACKAGE"
  -e VERSION="$VERSION"
  -e EXPECTED_SHASUM="$SHASUM"
  -e EXPECTED_INTEGRITY="$INTEGRITY"
)

run_container() { # $1 = MODE; extra -e args follow
  local mode="$1"; shift
  git -C "$REPO_ROOT" archive HEAD \
    | docker run "${DOCKER_FLAGS[@]}" -e MODE="$mode" "$@" "$IMAGE"
}

if [ "$ESCALATE" = 0 ]; then
  echo "==> Verifying ${PACKAGE}@${VERSION} from HEAD (${HEAD_SHA:0:8}) — rung 1, token-free" >&2
  run_container rung1
  exit $?
fi

# --- escalation: mint a short-lived read-only token -------------------------
# NOTE: granular-token mint/parse + `npm stage download` are not yet validated
# against a live 2FA account (spike 2). Token is injected via `-e` for v1
# pragmatism on macOS (no easy tmpfs-file injection); it is read-only,
# --packages-scoped, --expires 1, and revoked on exit, so the residual
# `docker inspect` exposure on a single-user laptop is acceptable. Harden to
# tmpfs injection later if wanted.
: "${STAGE_ID:?block missing 'stage_id=' (required for --escalate)}"

echo "==> Minting read-only npm token for '${PACKAGE}' (OTP may be required)" >&2
TOKEN_JSON="$(npm token create --read-only --packages "$PACKAGE" --expires 1 --json)"
# The secret token value.
TOKEN="$(printf '%s' "$TOKEN_JSON" | sed -nE 's/.*"token"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -1)"
# The revocable handle. npm emits either "id" or "key" depending on version;
# match either. NEVER revoke by the raw token value (leaks the secret into
# argv and isn't a valid handle), so this is kept strictly separate.
TOKEN_ID="$(printf '%s' "$TOKEN_JSON" | sed -nE 's/.*"(id|key)"[[:space:]]*:[[:space:]]*"([^"]+)".*/\2/p' | head -1)"
if [ -z "$TOKEN" ]; then
  echo "FAIL: could not parse a token from 'npm token create' output." >&2
  echo "$TOKEN_JSON" >&2
  exit 3
fi

# Revoke on any exit (success, failure, Ctrl-C). Revoke ONLY by the id/key
# handle; if it's unknown, warn rather than risk passing the secret.
cleanup() {
  if [ -n "$TOKEN_ID" ]; then
    echo "==> Revoking read-only token" >&2
    npm token revoke "$TOKEN_ID" >/dev/null 2>&1 \
      || echo "WARN: token revoke failed — revoke '$TOKEN_ID' manually (read-only, expires in 1 day)." >&2
  else
    echo "WARN: could not determine the token id from npm output — could not auto-revoke." >&2
    echo "      Revoke it manually in your npm account (read-only, expires in 1 day)." >&2
  fi
}
trap cleanup EXIT

echo "==> Verifying ${PACKAGE}@${VERSION} from HEAD (${HEAD_SHA:0:8}) — full cascade" >&2
run_container escalate -e STAGE_ID="$STAGE_ID" -e DIST_TAG="$DIST_TAG" -e NPM_TOKEN="$TOKEN"
