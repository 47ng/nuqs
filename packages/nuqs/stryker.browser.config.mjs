import shared from './stryker.shared.config.mjs'

const config = {
  ...shared,
  mutate: ['src/useQueryState.ts', 'src/useQueryStates.ts'],
  testFiles: [
    'src/useQueryState.browser.test.tsx',
    'src/useQueryStates.browser.test.tsx'
  ],
  vitest: {
    configFile: 'vitest.browser.mutation.config.ts',
    related: false
  },
  tempDirName: '../../node_modules/.cache/stryker-tmp/nuqs-browser-hooks',
  incrementalFile: 'reports/mutation/cache/browser-hooks.json'
}

export default config
