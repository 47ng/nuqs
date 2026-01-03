import { test } from '@playwright/test'

export type TestConfig = {
  path: string
  hook?: 'useQueryState' | 'useQueryStates'
  router?:
    | 'next-app'
    | 'next-pages'
    | 'react-spa'
    | 'react-router-v6'
    | 'react-router-v7'
    | 'remix'
    | 'tanstack-router'
    | 'waku'
  description?: string
}

const routerDisplay: Record<NonNullable<TestConfig['router']>, string> = {
  'next-app': 'app router',
  'next-pages': 'pages router',
  'react-spa': 'React SPA',
  'react-router-v6': 'React Router v6',
  'react-router-v7': 'React Router v7',
  remix: 'Remix',
  'tanstack-router': 'TanStack Router',
  waku: 'Waku'
}

export function defineTest(
  firstArg: string | { label: string; variants: string },
  implementation: (config: TestConfig) => void
) {
  return (config: TestConfig) => {
    const label = typeof firstArg === 'string' ? firstArg : firstArg.label
    const variants = typeof firstArg === 'string' ? null : firstArg.variants
    const describeLabel = [
      label,
      config.router && routerDisplay[config.router],
      config.hook,
      variants,
      config.description
    ]
      .filter(Boolean)
      .join(' - ')
    test.describe(
      describeLabel,
      {
        tag: [
          config.hook && (`@${config.hook}` as const),
          config.router && (`@${config.router}` as const)
        ].filter(x => !!x)
      },
      implementation.bind(null, config)
    )
  }
}
