#!/usr/bin/env bash

set -e

# Place ourselves in the package directory
cd "$(dirname "$0")/.."

# Abort if the version was not bumped by semantic release
version=$(cat package.json | jq -r '.version')
if [[ $version == "0.0.0-semantically-released" ]]; then
  echo "Aborting publish to next-usequerystate: the version was not bumped by semantic release"
  exit 0
fi

# Get the release channel (dist tag) from the version name.
# If version contains a hyphen, it's a prerelease (beta),
# otherwise it's a stable release (latest)
distTag="latest"
if [[ $version == *"-"* ]]; then
  distTag="beta"
fi

echo "Publishing next-usequerystate@${version} to the ${distTag} channel"

# Login to the npm registry
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Rename & publish the package
pnpm pkg set name=next-usequerystate
pnpm publish --no-git-checks --tag ${distTag}

# Cleanup
rm -f .npmrc
