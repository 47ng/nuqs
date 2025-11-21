[One.js](https://onestack.dev/) is supported as a community-contributed adapter.

It's not built-in because it's based on both React web & React Native, and
pulls a lot of dependencies into the nuqs build process (doubling the dependency
install time).

If it becomes popular and there is sufficient demand, it may be included in the
core package.

Install the adapter using the CLI or copy/paste above,
then integrate the adapter into the root layout file,
by wrapping the `<Slot>` component:

```tsx title="app/_layout.tsx"
// [!code word:NuqsAdapter]
import { NuqsAdapter } from './nuqs-one-adapter'
import { Slot } from 'one'

export default function Layout() {
  return (
    <>
      {typeof document !== 'undefined' && (
        <>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          <link rel="icon" href="/favicon.svg" />
        </>
      )}
      <NuqsAdapter>
        <Slot />
      </NuqsAdapter>
    </>
  )
}
```
