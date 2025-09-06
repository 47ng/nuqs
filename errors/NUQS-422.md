# Invalid Options Combination.

This warning will show up if you combine `shallow: true` (the default) and `limitUrlUpdates: debounce` options.

Debounce only makes sense for server-side data fetching, the returned client state is always updated **immediately**, so combining `limitUrlUpdates: debounce` with `shallow: true` will not work as expected.

If you are fetching client-side, you’ll want to debounce the state returned by the hooks instead (using a 3rd party `useDebounce` utility hook).

## Solution

- Set `shallow: false` to allow debounce to work properly, check the [documentation](https://nuqs.dev/docs/options#debounce) for more information.
