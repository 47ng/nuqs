const config = {
  $schema: './node_modules/@stryker-mutator/core/schema/stryker-schema.json',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.browser.test.ts',
    '!src/adapters/**',
    '!src/useQueryState.ts',
    '!src/useQueryStates.ts',
    // These modules are covered by the browser project, which Stryker does not run.
    '!src/lib/sync.ts',
    '!src/lib/url-encoding.ts',
    '!src/lib/queues/rate-limiting.ts',
    '!src/lib/queues/useSyncExternalStores.ts'
  ],
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.mutation.config.ts',
    related: true
  },
  // Keep sandbox package.json files outside packages/ so Turbo does not
  // discover them as duplicate workspaces after an interrupted run.
  tempDirName: '../../.stryker-tmp/nuqs',
  ignorePatterns: ['tsconfig.json', 'tsconfig.build.json'],
  reporters: ['clear-text', 'progress', 'html'],
  thresholds: {
    high: 80,
    low: 74,
    break: 74
  },
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  htmlReporter: {
    fileName: 'reports/mutation/html/index.html'
  }
}

export default config
