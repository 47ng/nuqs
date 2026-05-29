# Invalid Options Combination.

This warning did show up between versions `nuqs@>=2.6.0 && nuqs@<=2.7.2` if you combined `shallow: true` (the default) and `limitUrlUpdates: debounce` options.

The initial argument was that:

> Debounce only made sense for server-side data fetching, the returned client state is always updated **immediately**, so combining `limitUrlUpdates: debounce` with `shallow: true` will not work as expected.
>
> If you are fetching client-side, you’ll want to debounce the state returned by the hooks instead (using a 3rd party `useDebounce` utility hook).

However, debounce _does_ have a purpose even in shallow routing: **reducing history bloat**.

While nuqs uses `history: replace` by default to avoid polluting your history **stack** (the one you navigate with the Back & Forward browser buttons), every URL update is recorded in the browser's **global history** (that you access via a menu, like `⌘ Y`).

Debouncing gives you finer control over how this global history is populated, with the trade-off of a less reactive URL.

Regardless, debounce only applies to URL updates, so the recommendation for client-side fetching still stands: you'll likely want to debounce the returned state in userland before feeding it to TanStack Query, SWC, tRPC or other tools.
