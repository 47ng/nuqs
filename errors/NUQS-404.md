# `nuqs` requires an adapter to work with your framework

## Probable cause

You haven't wrapped the components calling `useQueryState(s)` with
an adapter.

[Adapters](https://nuqs.dev/docs/adapters) are based on React Context,
and provide nuqs hooks with the interfaces to work with your framework:
reacting to URL changes, and calling your router when you update your state.

## Possible solutions

Follow the setup instructions to import and wrap your application
using a suitable adapter:

- [Next.js (app router)](https://nuqs.dev/docs/adapters#nextjs-app-router)
- [Next.js (pages router)](https://nuqs.dev/docs/adapters#nextjs-pages-router)
- [React SPA (eg: with Vite)](https://nuqs.dev/docs/adapters#react-spa)
- [Remix](https://nuqs.dev/docs/adapters#remix)
- [React Router v6](https://nuqs.dev/docs/adapters#react-router-v6)
- [React Router v7](https://nuqs.dev/docs/adapters#react-router-v7)
- [React Router v8](https://nuqs.dev/docs/adapters#react-router-v8)
- [TanStack Router](https://nuqs.dev/docs/adapters#tanstack-router)
- [Waku](https://nuqs.dev/docs/adapters#waku)

### Test adapter

If you encounter this error outside of the browser, like in a test
runner (eg: Vitest or Jest), you may use the [testing adapter](https://nuqs.dev/docs/testing)
from `nuqs/adapters/testing` to mock the initial search params and access
setup/assertion testing facilities.

### Monorepo setups

Components using nuqs can live in workspace or shared packages. Make sure they
are rendered below the application's `NuqsAdapter` and that all packages use the
same version of `nuqs`.

Multiple copies of the same version are supported by the fix in
[#1469](https://github.com/47ng/nuqs/pull/1469). If every package already uses
the same version, upgrade to a release that includes it.
