'use client'

import dynamic from 'next/dynamic'

// Load the devtools (and, via the impl module, `nuqs/devtools` itself) only in
// development. In a production build `NODE_ENV` folds to the `() => null` branch,
// so the dynamic import is dead code and none of the panel / EventClient / sink
// ships in the deployed docs bundle.
export const NuqsDevtoolsShell =
  process.env.NODE_ENV === 'production'
    ? () => null
    : dynamic(() => import('./nuqs-devtools-impl'), { ssr: false })
