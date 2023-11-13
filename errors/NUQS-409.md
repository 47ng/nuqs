# Multiple versions of the library are loaded

This error occurs if two different versions of `next-usequerystate` are
loaded in the same application.

This may happen if you are using a package that embeds next-usequerystate and
you are also using next-usequerystate directly.

## Possible Solutions

Inspect your dependencies for duplicate versions of `next-usequerystate` and
use the `resolutions` field in `package.json` to force all dependencies
to use the same version.
