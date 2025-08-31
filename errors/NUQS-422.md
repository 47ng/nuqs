# Invalid Options Combination.

This error will show up if you combine `shallow: true` and `limitUrlUpdates: debounce` options.

Debounce only makes sense for server-side data fetching, so combining it with `shallow: true` will not work as expected.

## Solution

- Set `shallow: false` to allow debounce to work properly, check the [documentation](https://nuqs.47ng.com/docs/options#debounce) for more information.
