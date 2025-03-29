# Multiple adapter contexts detected

## Probable cause

This error occurs in [debug mode](https://nuqs.47ng.com/docs/debugging) in
certain monorepo setups where references of the adapter context aren't the same
in different packages, and cause a [`NUQS-404 - nuqs requires an adapter to work with your framework`](./NUQS-404.md) error.

## Root cause

As described in the [React docs](https://react.dev/reference/react/useContext#my-component-doesnt-see-the-value-from-my-provider), this can happen with Context providers (which
is what adapters are) being re-created in different modules and causing different
references being used for a provider and consumers.

## Possible solutions

See issue [#798](https://github.com/47ng/nuqs/issues/798) for more details.
