import shared from './stryker.shared.config.mjs'

const config = {
  ...shared,
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.browser.test.ts',
    // Framework adapters are covered by the end-to-end test benches.
    '!src/adapters/**',
    // The React hooks are covered by the browser mutation run.
    '!src/useQueryState.ts',
    '!src/useQueryStates.ts',
    // These browser-only helpers are outside the focused PR budget.
    '!src/lib/sync.ts',
    '!src/lib/url-encoding.ts',
    '!src/lib/queues/rate-limiting.ts',
    '!src/lib/queues/useSyncExternalStores.ts'
  ],
  testFiles: [
    'src/!(api|*.browser).test.ts',
    'src/lib/**/!(*.browser).test.ts'
  ],
  vitest: {
    configFile: 'vitest.mutation.config.ts',
    related: false
  },
  tempDirName: '../../node_modules/.cache/stryker-tmp/nuqs-node',
  incrementalFile: 'reports/mutation/cache/node.json'
}

export default config
