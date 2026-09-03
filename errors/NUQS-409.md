# Multiple copies of the library are loaded

This error occurs if two copies of `nuqs` with **different versions** are
loaded in the same application.

This may happen if you are using a package that embeds `nuqs` and
you are also using `nuqs` directly.

Copies of the same version share their internal state, so they behave as
one. Copies of different versions do not: each keeps its own pending
updates overlay, so hooks from one copy do not see the values written by
the other. Copies older than the change linked below also keep their own
URL update budget, and compete for the browser's single History API rate
limit.

## Possible Solutions

Inspect your dependencies for duplicate versions of `nuqs` and
use your package manager's overrides or resolutions to align them.

If you publish a library that uses `nuqs`, declare it as a peer dependency and
exclude it from your bundle.

[#1469](https://github.com/47ng/nuqs/pull/1469) adds support for multiple copies
of the same version. Different versions still need to be aligned.
