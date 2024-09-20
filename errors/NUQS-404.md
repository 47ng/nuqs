# `nuqs` requires an adapter to work with your framework

## Probable cause

You haven't wrapped the components calling `useQueryState(s)` with
an adapter.

Adapters are based on React Context, and provide nuqs hooks with
the interfaces to work with your framework.

## Possible solutions

Follow the setup instructions to import and wrap your application
using a suitable adapter.

Example, for Next.js (app router)

```tsx
// src/app/layout.tsx
import React from 'react'
import { NuqsAdapter } from 'nuqs/adapters/next'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

### Test adapter

If you encounter this error outside of the browser, like in a test
runner, you may use the test adapter from `nuqs/adapters/test`
to mock the context and access setup/assertion testing facilities.

```tsx

```
