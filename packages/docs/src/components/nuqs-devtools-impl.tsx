'use client'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { NuqsDevtools } from 'nuqs/devtools'

// The actual devtools mount. Kept in its own module so the dev-only dynamic
// import in `nuqs-devtools.tsx` is the single reference to `nuqs/devtools` (and
// `@tanstack/react-devtools`), letting them tree-shake out of production.
// Importing `nuqs/devtools` installs the debug sink (always on in dev), so
// interacting with any page that uses nuqs streams its internals into the panel.
export default function NuqsDevtoolsImpl() {
  return (
    <TanStackDevtools plugins={[{ name: 'nuqs', render: <NuqsDevtools /> }]} />
  )
}
