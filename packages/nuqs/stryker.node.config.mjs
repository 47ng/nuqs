import shared from './stryker.shared.config.mjs'
import browser from './stryker.browser.config.mjs'

const nodeMutate = [
  'src/**/*.{ts,tsx}',
  '!src/**/*.test.{ts,tsx}',
  '!src/adapters/**',
  ...browser.mutate.map(path => `!${path}`)
]

const config = {
  ...shared,
  mutate: nodeMutate,
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
