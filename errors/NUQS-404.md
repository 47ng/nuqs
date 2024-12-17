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
