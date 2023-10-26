#!/usr/bin/env bash

set -e

# Place ourselves in the package directory
cd "$(dirname "$0")/.."

# Copy the README & License from the root of the repository
cp -f ../../README.md ../../LICENSE ./

# Patch the version from package.json
VERSION=$(node -p "require('./package.json').version")
sed -i '' "s/0.0.0-inject-version-here/${VERSION}/g" dist/index.{js,cjs}
