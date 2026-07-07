# Multiple copies of the library are loaded

This error occurs if two copies of `nuqs` are loaded in the
same application: either two different versions, or the same
version duplicated by the package manager or bundler
(e.g. pnpm peer-set instancing).

This may happen if you are using a package that embeds `nuqs` and
you are also using `nuqs` directly.

Duplicated copies each run their own URL update queue against the
browser's single History API rate limit, and hooks from different
copies won't sync with each other.

## Possible Solutions

Inspect your dependencies for duplicate versions of `nuqs` and
use the `resolutions` field in `package.json` to force all dependencies
to use the same version.
