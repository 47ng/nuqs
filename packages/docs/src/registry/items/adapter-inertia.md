[Inertia](https://inertiajs.com/) is supported as a community-contributed adapter.

Install the adapter using the CLI or copy/paste above,
then integrate the adapter into the root layout file,
by wrapping it around the children of the layout component:

```tsx title="resources/js/Layouts/AppLayout.tsx"
// [!code word:NuqsAdapter]
import { NuqsAdapter } from '.@/lib/nuqs-inertia-adapter'
import { PropsWithChildren } from 'react'

export default function Layout({ children }: PropsWithChildren) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
```

## Try it out

Check out the [demo app](https://github.com/47ng/nuqs-inertia-pingcrm)
which is a fork of Inertia's Ping CRM demo with nuqs.
