#!/usr/bin/env bash

set -e

# Place ourselves in the package directory
cd "$(dirname "$0")/.."

# Copy the README & License from the root of the repository
cp -f ../../README.md ../../LICENSE ./

# Patch the version from package.json
VERSION=$(node -p "require('./package.json').version")

if [[ "$(uname)" == "Darwin" ]]; then
  # macOS requires an empty string as the backup extension
  sed -i '' "s/0.0.0-inject-version-here/${VERSION}/g" dist/index.{js,cjs}
else
  # Ubuntu (CI/CD) doesn't
  sed -i "s/0.0.0-inject-version-here/${VERSION}/g" dist/index.{js,cjs}
fi
