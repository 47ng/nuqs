#!/usr/bin/env bash

set -e

# Place ourselves in the package directory
cd "$(dirname "$0")/.."

# Login to the npm registry
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Rename & publish the package
pnpm pkg set name=nuqs
pnpm publish

# Cleanup
rm -f .npmrc
