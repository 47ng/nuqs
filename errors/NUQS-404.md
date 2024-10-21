# `nuqs` requires an adapter to work with your framework

## Probable cause

You haven't wrapped the components calling `useQueryState(s)` with
an adapter.

[Adapters](https://nuqs.47ng.com/docs/adapters) are based on React Context,
and provide nuqs hooks with the interfaces to work with your framework.

## Possible solutions

Follow the setup instructions to import and wrap your application
using a suitable adapter:

- [Next.js (app router)](https://nuqs.47ng.com/docs/adapters#nextjs-app-router)
- [Next.js (pages router)](https://nuqs.47ng.com/docs/adapters#nextjs-pages-router)
- [React SPA (eg: with Vite)](https://nuqs.47ng.com/docs/adapters#react-spa)
- [Remix](https://nuqs.47ng.com/docs/adapters#remix)
- [React Router](https://nuqs.47ng.com/docs/adapters#react-router)

### Test adapter

If you encounter this error outside of the browser, like in a test
runner, you may use the test adapter from `nuqs/adapters/test`
to mock the context and access setup/assertion testing facilities.

```tsx

```
