# This package is ESM only.

Since version 2.0.0, `nuqs` is now an [ESM-only package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Probable cause

You may have encountered this error when trying to import `nuqs` in a CommonJS
environment, like Jest or ESLint.

## Possible solutions

If you cannot update your project to use ESM (which would be the most future-proof
solution), please refer to the following guides:

### Jest

See the [testing adapter documentation](https://nuqs.47ng.com/docs/testing#with-jest)
for its configuration with Jest.

### ESLint

See issue [#691](https://github.com/47ng/nuqs/issues/691) for more details.

### Something else?

If you are encountering this error in a different context, please
[open an issue](https://github.com/47ng/nuqs/issues/new/choose) with details about
your setup (a reproduction repository would be even better).
