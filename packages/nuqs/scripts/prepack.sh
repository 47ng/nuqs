#!/usr/bin/env bash

set -e

# Place ourselves in the package directory
cd "$(dirname "$0")/.."

# Copy the README & License from the root of the repository
cp -f ../../README.md ../../LICENSE ./

# Read the version from package.json
VERSION=$(jq -r '.version' < package.json)

if [[ "$(uname)" == "Darwin" ]]; then
  # macOS requires an empty string as the backup extension
  sed -i '' "s/0.0.0-inject-version-here/${VERSION}/g" dist/index.js
else
  # Ubuntu (CI/CD) doesn't
  sed -i "s/0.0.0-inject-version-here/${VERSION}/g" dist/index.js
fi
