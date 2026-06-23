# Canonical build/verify image for reproducible-release verification (staged
# and published).
#
# Mirrors the GitHub Actions runner environment that produces the release
# tarball (ubuntu-24.04-arm + actions/setup-node's official nodejs.org
# binary), so a local `npm pack` reproduces the published `.tgz` byte-for-byte.
#
# Pins (verify.lib.ts passes Node/npm/pnpm as --build-args read at the verified
# ref; the ARG defaults below are only fallbacks for a standalone `docker build`
# and may drift):
#   - Ubuntu 24.04   : matches the runner OS (glibc/zlib provenance)
#   - Node           : repo-root .node-version (the file actions/setup-node
#                      reads in CI); its bundled zlib decides the gzip layer.
#   - npm            : repo-root .npm-version (same file release-draft.yml's
#                      stage job reads to install the publishing npm).
#   - pnpm           : package.json "packageManager" (pnpm@x.y.z).
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
    npm install --global "pnpm@${PNPM_VERSION}"

# The analysis is baked into the image (NOT taken from the untrusted source
# archive) so that, under the runtime read-only rootfs, a malicious build
# cannot rewrite it. Two stages, two scripts, both root-owned and read-only;
# the host selects which one to run as the container command:
#   run1.reproduce.sh     — reproduce + emit the tarball (git archive on stdin)
#   run2.diff-contents.sh — extract + diff the two tarballs (/in mount, ro)
COPY run1.reproduce.sh run2.diff-contents.sh /usr/local/bin/
RUN chmod 0555 /usr/local/bin/run1.reproduce.sh /usr/local/bin/run2.diff-contents.sh

# Run reproductions as a non-root user (ubuntu:24.04 already ships a uid-1000
# `ubuntu` user, so let useradd pick a free uid rather than collide).
RUN useradd --create-home verifier
USER verifier
WORKDIR /home/verifier

# No ENTRYPOINT: the host passes the script name (run1.reproduce.sh /
# run2.diff-contents.sh) as the container command.
