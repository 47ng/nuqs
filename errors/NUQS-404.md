# `nuqs` requires an adapter to work with your framework

## Probable cause

You haven't wrapped the components calling `useQueryState(s)` with
an adapter.

[Adapters](https://nuqs.47ng.com/docs/adapters) are based on React Context,
and provide nuqs hooks with the interfaces to work with your framework:
reacting to URL changes, and calling your router when you update your state.

## Possible solutions

Follow the setup instructions to import and wrap your application
using a suitable adapter:

- [Next.js (app router)](https://nuqs.47ng.com/docs/adapters#nextjs-app-router)
- [Next.js (pages router)](https://nuqs.47ng.com/docs/adapters#nextjs-pages-router)
- [React SPA (eg: with Vite)](https://nuqs.47ng.com/docs/adapters#react-spa)
- [Remix](https://nuqs.47ng.com/docs/adapters#remix)
- [React Router v6](https://nuqs.47ng.com/docs/adapters#react-router-v6)
- [React Router v7](https://nuqs.47ng.com/docs/adapters#react-router-v7)

### Test adapter

If you encounter this error outside of the browser, like in a test
runner (eg: Vitest or Jest), you may use the [testing adapter](https://nuqs.47ng.com/docs/testing)
from `nuqs/adapters/testing` to mock the initial search params and access
setup/assertion testing facilities.

### Monorepo setups

This error can also occur in monorepo setups where components using nuqs hooks
are in different packages resolving to different `nuqs` versions,
leading to different context references being used.

If you [enable debugging](https://nuqs.47ng.com/docs/debugging), you might see a
[`NUQS-303 - Multiple adapter contexts detected`](./NUQS-303.md) error, confirming
this hypothesis.

For additional clarification, ensure that all packages use compatible versions
of `nuqs` to prevent this issue from arising. See issue
[#798](https://github.com/your-repo/issues/798) for more details and
possible solutions.
