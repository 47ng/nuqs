[Waku](https://waku.gg/) is supported as a community-contributed adapter.

Install the adapter using the CLI or copy/paste above,
then integrate the adapter into a \_layout.tsx or \_root.tsx file,
by wrapping the `{children}` component:

```tsx title="app/_layout.tsx"
// [!code word:NuqsAdapter]
import { Suspense, type ReactNode } from 'react'

import { NuqsAdapter } from './nuqs-waku-adapter'

type LayoutProps = { children: ReactNode }

export default async function Layout({ children }: LayoutProps) {
  return (
    <>
      <NuqsAdapter>
        <Suspense>{children}</Suspense>
      </NuqsAdapter>
    </>
  )
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
    // render: 'static', // works but can cause hydration warnings
  } as const
}
```
