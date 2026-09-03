# Multiple copies of the library are loaded

This error occurs if two different versions of `nuqs` are loaded in the
same application.

This may happen if you are using a package that embeds `nuqs` and
you are also using `nuqs` directly.

Copies of the same version share an internal state (island architecture).
Different copies will use different queues and don't know about each other,
so they risk racing on the History API rate limits.

## Possible Solutions

Inspect your dependencies for duplicate versions of `nuqs` and
use your package manager's overrides or resolutions to align them.

If you publish a library that uses `nuqs`, declare it as a peer dependency and
exclude it from your bundle.

[#1469](https://github.com/47ng/nuqs/pull/1469) adds support for multiple copies
of the same version. Different versions still need to be aligned.
