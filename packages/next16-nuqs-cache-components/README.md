Reproduction for an issue where in a PNPM monorepo, when Turbopack
encounters an error using a dynamic API with cacheComponents,
it marks monorepo packages sources as `<unknown>` and dumps its source
code as part of the HTML element stack trace pointing to the component
where "use cache" or Suspense should be used.

This causes confusion to have unrelated code in the stack trace.

Having a build package from NPM doesn't show this behaviour.

## Reproduction

1. Clone the nuqs repository
2. checkout the `test/monorepo-repro-next16-nuqs-cache-components` branch.
3. Install dependencies with `pnpm install`.
4. Build the package and its dependencies `pnpm run build --filter next16-nuqs-cache-components...`

Observe the error:

```
> next build --debug-prerender

 ⚠ Prerendering is running in debug mode. Note: This may affect performance and should not be used for production.
   ▲ Next.js 16.0.1 (Turbopack, Cache Components)
   - Experiments (use with caution):
     ⨯ prerenderEarlyExit (disabled by `--debug-prerender`)
     ✓ serverSourceMaps (enabled by `--debug-prerender`)
     ⨯ turbopackMinify (disabled by `--debug-prerender`)

   Creating an optimized production build ...
 ✓ Compiled successfully in 1993.8ms
 ✓ Finished TypeScript in 1536.9ms
 ✓ Collecting page data in 599.0ms
Error: Route "/": Uncached data was accessed outside of <Suspense>. This delays the entire page from rendering, resulting in a slow user experience. Learn more: https://nextjs.org/docs/messages/blocking-route
    at section (<anonymous>)
    at <unknown> (turbopack:///[project]/packages/nuqs/src/adapters/lib/context.ts:63:13)
    at NuqsAdapter (turbopack:///[project]/packages/nuqs/src/adapters/next/app.ts:13:3)
    at body (<anonymous>)
    at html (<anonymous>)
  61 |   useAdapter: UseAdapterHook
  62 | ): AdapterProvider {
> 63 |   return ({ children, defaultOptions, processUrlSearchParams, ...props }) =>
     |             ^
  64 |     createElement(
  65 |       context.Provider,
  66 |       {
To get a more detailed stack trace and pinpoint the issue, start the app in development mode by running `next dev`, then open "/" in your browser to investigate the error.
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error

> Export encountered errors on following paths:
        /page: /
```
