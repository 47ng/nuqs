# Multiple versions of the library are loaded

This error occurs if two different versions of `nuqs` are
loaded in the same application.

This may happen if you are using a package that embeds `nuqs` and
you are also using `nuqs` directly.

## Possible Solutions

Inspect your dependencies for duplicate versions of `nuqs` and
use the `resolutions` field in `package.json` to force all dependencies
to use the same version.
