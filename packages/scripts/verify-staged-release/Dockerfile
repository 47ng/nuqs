# Canonical build/verify image for staged-release verification.
#
# Mirrors the GitHub Actions runner environment that produces the staged
# tarball (ubuntu-24.04-arm + actions/setup-node's official nodejs.org
# binary), so a local `npm pack` reproduces the staged `.tgz` byte-for-byte.
#
# Pins:
#   - Ubuntu 24.04   : matches the runner OS (glibc/zlib provenance)
#   - Node           : from .node-version (official nodejs.org tarball)
#   - pnpm           : from package.json "packageManager"
#   - npm            : hardcoded to match release-draft.yml's pinned npm.
#                      TODO(unify): extract a shared .npm-version once the
#                      workflow is editable, and read it on both sides.
#   - jq             : required by packages/nuqs/scripts/prepack.sh
FROM ubuntu:24.04

ARG NODE_VERSION=24.11.0
ARG PNPM_VERSION=11.0.9
ARG NPM_VERSION=11.16.0

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl git jq xz-utils \
 && rm -rf /var/lib/apt/lists/*

# Node: fetch the exact official binary actions/setup-node installs, so the
# bundled zlib (which determines the gzip layer of the tarball) is identical.
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      arm64) nodearch="linux-arm64" ;; \
      amd64) nodearch="linux-x64" ;; \
      *) echo "unsupported arch: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSLo /tmp/node.tar.xz \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${nodearch}.tar.xz"; \
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1; \
    rm /tmp/node.tar.xz; \
    npm install --global "npm@${NPM_VERSION}"; \
    npm install --global "pnpm@${PNPM_VERSION}"; \
    node --version; npm --version; pnpm --version

# The analysis is baked into the image (NOT taken from the untrusted source
# archive) so that, under the runtime read-only rootfs, a malicious build
# cannot rewrite the verdict logic. Lives in a root-owned, read-only path.
COPY analyze.sh /usr/local/bin/analyze.sh
RUN chmod 0555 /usr/local/bin/analyze.sh

# Run reproductions as a non-root user (ubuntu:24.04 already ships a uid-1000
# `ubuntu` user, so let useradd pick a free uid rather than collide).
RUN useradd --create-home verifier
USER verifier
WORKDIR /home/verifier

ENTRYPOINT ["/usr/local/bin/analyze.sh"]
